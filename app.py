import os
from flask import Flask, redirect, request, session, url_for, jsonify, send_file, make_response
import requests
import json
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime, timedelta
from functools import wraps
from models import User, Label, Video, Folder

#app = Flask(__name__)#
ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), './views')
app = Flask(__name__, template_folder=ASSETS_DIR, static_folder=ASSETS_DIR)

BASE_URL = 'https://api.box.com/'
indexHtml = open('views/index.html').read()

LOG_FILENAME = './vm.log'

app.logger.setLevel(logging.INFO) # use the native logger of flask

handler = logging.handlers.RotatingFileHandler(
    LOG_FILENAME,
    maxBytes=1024 * 1024 * 5,
    backupCount=5
    )

app.logger.addHandler(handler)

@app.route('/login2')
def index2():
    return make_response(open('views/index.html').read())

def requires_auth(func):
    #Checks for OAuth credentials in the session#
    @wraps(func)
    def checked_auth(*args, **kwargs):
        if 'oauth_credentials' not in session:
            #or check in file#
            return redirect(url_for('login'))
        else:
            return func(*args, **kwargs)
    return checked_auth

@app.route('/')
def redirect_to_folder():
    #return redirect(url_for('box_folder', folder_id='1311201105'))
    return 'OK'

@app.route('/box-folder/<folder_id>')
@requires_auth
def box_folder(folder_id):
    api_response = getBoxFolder(folder_id)
    page_output = {
        'access_token': session['oauth_credentials']['access_token'],
        'api_response': api_response.json
    }
    return jsonify(page_output)

@app.route('/box-auth')
def box_auth():
    oauth_response = get_token(code=request.args.get('code'))
    boxFile = open('./auth-tokens', 'w')
    access_token = oauth_response.get('access_token')
    refresh_token = oauth_response.get('refresh_token')
    token_expiration = oauth_response.get('expires_in')
    oauth_expiration= (datetime.now()
                   + timedelta(seconds=token_expiration - 15))
    boxFile.write(access_token + '\n')
    boxFile.write(refresh_token + '\n')
    boxFile.write(str(oauth_expiration))
    boxFile.flush()
    boxFile.close()
    set_oauth_credentials(oauth_response)
    #return redirect(url_for('box_folder', folder_id='1311201105'))
    return 'OK'

def refresh_access_token_if_needed(func):
    """
    Does two checks:
    - Checks to see if the OAuth credentials are expired based
    on what we know about the last access token we got
    and if so refreshes the access_token
    - Checks to see if the status code of the response is 401,
    and if so refreshes the access_token
    """
    @wraps(func)
    def checked_auth(*args, **kwargs):
        if oauth_credentials_are_expired():
            refresh_oauth_credentials()

        #calls get_box_folder#
        api_response = func(*args, **kwargs)
        if api_response.status_code == 401:
            refresh_oauth_credentials()
            #calls get_box_folder#
            api_response = func(*args, **kwargs)
        return api_response
    return checked_auth

@app.route('/login')
def login():
    uname = request.args.get('uname')
    passwd = request.args.get('passwd')

    # TODO Check this from DB #
    if(uname != 'vm' or
        passwd != 'video01'):
        return "Incorrect Login"

    if os.path.exists('./auth-tokens'):
        boxFile = open('./auth-tokens', 'r')
        access_token = boxFile.readline().rstrip()
        refresh_token = boxFile.readline().rstrip()
        oauth_expiration = boxFile.readline().rstrip()
        boxFile.close()
        oauth_expiration_str = oauth_expiration[:19]
        #Format 2013-11-30 03:36:23#
        oauth_expiration_date = datetime.strptime(oauth_expiration_str, '%Y-%m-%d %H:%M:%S')
        session['oauth_expiration'] = oauth_expiration_date
        if oauth_credentials_are_expired():
            app.logger.info(str(datetime.now())
                    + '- refresh_token called')
            oauth_response = get_token(grant_type='refresh_token',
                               refresh_token=refresh_token)

            set_oauth_credentials(oauth_response)
            #Write these tokens into file#
            boxFile = open('./auth-tokens', 'w')
            token_expiration = oauth_response.get('expires_in')
            oauth_expiration= (datetime.now()
                   + timedelta(seconds=token_expiration - 15))
            boxFile.write(oauth_response.get('access_token') + '\n')
            boxFile.write(oauth_response.get('refresh_token') + '\n')
            boxFile.write(str(oauth_expiration))
            boxFile.close()
        else:
            #set file auth contents into session
            session['access_token'] = access_token
        return 'OK'
        #return jsonify(api_response.json['item_collection'])
    else:
        params = {
            'response_type': 'code',
            'client_id': '0gd3ftzthjbr0zu0lsseh8lgp16rwmg2'
        }
        return redirect(build_box_api_url('oauth2/authorize', params=params))

@refresh_access_token_if_needed
def getBoxFolder(folder_id):
    #Send drop downs from here#
    #No error checking. If an error occurs, we just return its JSON#
    resource = '2.0/folders/%s' % folder_id
    url = build_box_api_url(resource)
    bearer_token = session['access_token']
    if bearer_token is None:
        bearer_token = session['oauth_credentials']['access_token']
    auth_header = {'Authorization': 'Bearer %s' % bearer_token}
    api_response = requests.get(url, headers=auth_header)
    return api_response

@app.route('/saveVideo')
def saveVideo():
    #Saving Video#
    input = {"videoId":"2", "labels": [
        { "Category":"Coverage" , "Label":"C1" },
        { "Category":"Pass" , "Label":"P2" },
        { "Category":"Series" , "Label":"S3" }
    ]}
    #Get all the label ids here#
    labels = input['labels']
    commaLabelIds = ""
    for record in labels:
        oneLabel = Label.select().where((Label.category == record['Category'])
                           & (Label.label == record['Label'])).get()
        commaLabelIds = commaLabelIds + str(oneLabel.labelId) + ','
    video = Video.select().where(Video.videoId == input['videoId']).get()
    video.labelIds = commaLabelIds[:-1]
    video.status = 'DONE'
    video.save()
    return 'Video/Labels saved'

@app.route('/getVideos')
def getVideos():
    #Sending Videos#
    input = {"result":"OK", "videos": [
        { "videoId":"1" , "fileName":"abc.mp4", "boxLink":"https://box.com/s/abc.mp4", "folderName":"Game234" },
        { "videoId":"2" , "fileName":"abc2.mp4", "boxLink":"https://box.com/s/abc2.mp4", "folderName":"Game234" },
        { "videoId":"3" , "fileName":"abc3.mp4", "boxLink":"https://box.com/s/abc3.mp4", "folderName":"Game23" }
    ]}
    return json.dumps(input)

@app.route('/insertVideo')
def insertVideo():

    record = {"fileName":"abc.mov4",
              "boxLink":"asjdksj",
              "folderName":"Game2123",
              "folderId":"12344522"}
    video = Video.create(
                         fileName=record['fileName'],
                         boxLink=record['boxLink'],
                         folderName=record['folderName'],
                         folderId=record['folderId'])
    return 'video saved'

@app.route('/saveLabel')
def saveLabel():
    #Saving Label#
    record = {"category":"Coverage", "label":"C3"}
    user = Label.create(
        category=record["category"],
        label=record["label"]
    )
    return 'Label saved'

@app.route('/getLabels')
def getLabels():
    #Getting Labels#
    print 'getting all the labels'
    app.logger.info(str(datetime.now())
                    + '- /getLabels called')
    labels = []
    for label in Label.select():
        labels.append({'category':label.category, 'label':label.label})
    return json.dumps(labels)

@app.route('/saveUser')
def saveUser():
    #Saving User#
    record = {"username":"vmuser", "password":"pass01", "email":"", "join_date":""}
    user = User.create(
        username=record["username"],
        password=record["password"],
        email=record["email"],
        join_date=datetime.now()
    )
    return 'User saved'

@app.route('/logout')
def logout():
    #write tokens back to file #
    session.clear()
    return 'You are now logged out of your Box account.'

# OAuth 2 Methods

@app.route('/getFileDetails')
@requires_auth
def getFileDetails():
    #Check if there are any files with not DONE status
    #If so, return those file details
    videos = []
    videosInDb = 'True'

    try:
        #for record in Video.select().where(Video.status == 'N').get():
        for record in Video.raw("select * from vm_videos where status='N'"):
            videos.append({'videoId':record.videoId, 'fileName':record.fileName,
                       'folderName':record.folderName, 'boxLink':record.boxLink})
        #print videos
        if len(videos) > 0:
            return jsonify(results = videos)
    except Video.DoesNotExist:
        videosInDb = 'False'

    api_response = getBoxFolder('1311201105')
    #If no files in the table, get it from Box
    items = api_response.json['item_collection']
    filesResponse = []
    for record in items['entries']:
        folderId = record['id']
        count = Video.select().where(Video.folderId == folderId).count()
        if count >= 1:
            continue
        else:
            #Call file API, insert them into Videos table and return those details
            files = getBoxFolder(folderId)
            fileItems = files.json['item_collection']['entries']
            for rs in fileItems:
                print rs['name']
                print rs['id']
            filesResponse.append(fileItems)
            return jsonify(results=filesResponse)

    return 'No New Videos'        #Insert here

def oauth_credentials_are_expired():
    return datetime.now() > session['oauth_expiration']


def refresh_oauth_credentials():
    #Gets a new access token using the refresh token grant type#
    refresh_token = session['oauth_credentials']['refresh_token']
    oauth_response = get_token(grant_type='refresh_token',
                               refresh_token=refresh_token)
    set_oauth_credentials(oauth_response)

def set_oauth_credentials(oauth_response):
    """
    Sets the OAuth access/refresh tokens in the session,
    along with when the access token will expire

    Will include a 15 second buffer on the exipration time
    to account for any network slowness.
    """
    token_expiration = oauth_response.get('expires_in')
    session['oauth_expiration'] = (datetime.now()
                                   + timedelta(seconds=token_expiration - 15))
    session['oauth_credentials'] = oauth_response
    session['access_token'] = oauth_response.get('access_token')
    session['refresh_token'] = oauth_response.get('refresh_token')
    boxFile = open('./auth-tokens', 'w')
    token_expiration = oauth_response.get('expires_in')
    oauth_expiration= (datetime.now()
                   + timedelta(seconds=token_expiration - 15))
    boxFile.write(oauth_response.get('access_token') + '\n')
    boxFile.write(oauth_response.get('refresh_token') + '\n')
    boxFile.write(str(oauth_expiration))
    boxFile.close()

def get_token(**kwargs):
    """
    Used to make token requests to the Box OAuth2 Endpoint

    Args:
        grant_type
        code
        refresh_token
    """
    #url = build_box_api_url('oauth2/token')
    #url = 'https://api.box.com/oauth2/token'
    url = 'https://www.box.com/api/oauth2/token'
    if 'grant_type' not in kwargs:
        kwargs['grant_type'] = 'authorization_code'
    kwargs['client_id'] = '0gd3ftzthjbr0zu0lsseh8lgp16rwmg2'
    kwargs['client_secret'] = 'J2OW2LYQsiNIXd7QEwUxfIE9hMZR97PK'
    kwargs['response_type'] = 'code'
    #kwargs['redirect_url'] = 'http://localhost:5000/'
    token_response = requests.post(url, data=kwargs)
    return token_response.json


def build_box_api_url(endpoint, params=''):
    if params != '':
        params = '&'.join(['%s=%s' % (k, v) for k, v in params.iteritems()])
    url = '%s%s?%s' % (BASE_URL, endpoint, params)
    return url


if __name__ == '__main__':
    # Bind to PORT if defined, otherwise default to 5000.
    port = int(os.environ.get('PORT', 5000))
    app.debug = False
    app.secret_key = '12345abcde'
    app.run(host='localhost', port=port)