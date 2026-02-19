#!/usr/bin/env python3
import os, json

ZIM_DIR = "/home/pi/zim"

files = [
    f for f in os.listdir(ZIM_DIR)
    if f.lower().endswith(".zim")
]

print("Content-Type: application/json\n")
print(json.dumps(files))