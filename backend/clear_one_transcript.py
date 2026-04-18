from pymongo import MongoClient
from bson import ObjectId
import sys

db = MongoClient('mongodb://localhost:27017')['snipx']

video_id = sys.argv[1] if len(sys.argv) > 1 else '69b122c28d31ea387682a062'
r = db.videos.update_one(
    {'_id': ObjectId(video_id)},
    {'$unset': {'transcript': 1}}
)
print("Cleared transcript, matched:", r.matched_count, "modified:", r.modified_count)
