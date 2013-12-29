import peewee as pw
from peewee import *

myDB = pw.MySQLDatabase("heroku_8910e417098409f", host="us-cdbr-east-04.cleardb.com",
                        port=3306, user="b62fe7ad88c524", passwd="c7077d2c")

class User(Model):
    username = CharField()
    password = CharField()
    email = CharField()
    join_date = DateTimeField()

    class Meta:
        database = myDB
        order_by = ('username',)

class Label(Model):
    labelId = PrimaryKeyField()
    category = CharField()
    label = CharField()

    class Meta:
        database = myDB
        db_table = 'vm_labels'
        order_by = ('category','label',)
        indexes = (
            # create a unique on category/label
            (('category', 'label'), True)
		)

class Folder(Model):
    folderId = PrimaryKeyField()
    boxId = CharField()
    name = CharField()
    status = CharField()

    class Meta:
        database = myDB
        db_table = 'vm_folders'
        order_by = ('boxId',)

class Video(Model):
    videoId = PrimaryKeyField()
    fileName = CharField()
    boxLink = CharField()
    labelIds = CharField()
    folderName = CharField()
    folderId = CharField()
    status = CharField(null=True)

    class Meta:
        database = myDB
        db_table = 'vm_videos'
        order_by = ('folderName','fileName',)
        indexes = (
            # create a unique on category/label
            (('folderName', 'fileName', 'folderId'), False)
        )

# when you're ready to start querying, remember to connect

print 'db connect and tables created'