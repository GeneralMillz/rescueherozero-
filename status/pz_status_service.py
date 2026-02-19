#!/usr/bin/env python3
import json
import os
import socket
import subprocess
import shutil
from http.server import BaseHTTPRequestHandler, HTTPServer

STATUS_PORT = 9100

def read_file(path):
    try:
        with open(path, "r") as f:
            return f.read().strip()
    except:
        return None

def get_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "0.0.0.0"

def get_cpu_temp():
    raw = read_file("/sys/class/thermal/thermal_zone0/temp")
    if raw:
        return round(int(raw) / 1000, 1)
    return None

def get_cpu_load():
    try:
        load1, _, _ = os.getloadavg()
        return round(load1, 2)
    except:
        return None

def get_mem_usage():
    try:
        out = subprocess.check_output(["free", "-m"]).decode()
        lines = out.splitlines()
        parts = lines[1].split()
        used = int(parts[2])
        total = int(parts[1])
        return used, total
    except:
        return None, None

def get_uptime():
    try:
        with open("/proc/uptime") as f:
            seconds = float(f.read().split()[0])
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        return hours, minutes
    except:
        return None, None

def folder_size(path):
    try:
        out = subprocess.check_output(["du", "-s", path]).decode().split()[0]
        return round(int(out) / 1024 / 1024, 2)
    except:
        return None

def check_port(port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.2)
    try:
        s.connect(("127.0.0.1", port))
        s.close()
        return "Online"
    except:
        return "Offline"

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/status.json":
            self.send_response(404)
            self.end_headers()
            return

        cpu_temp = get_cpu_temp()
        cpu_load = get_cpu_load()
        mem_used, mem_total = get_mem_usage()
        up_h, up_m = get_uptime()

        # SAFE, FAST, CORRECT STORAGE CALCULATION
        total, used, free = shutil.disk_usage("/")

        data = {
            "ip": get_ip(),
            "uptime": {"hours": up_h, "minutes": up_m},
            "cpu": {
                "temp_c": cpu_temp,
                "load": cpu_load,
                "governor": read_file("/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor")
            },
            "memory": {
                "used_mb": mem_used,
                "total_mb": mem_total
            },
            "kernel": read_file("/proc/sys/kernel/osrelease"),
            "storage": {
                "zim_gb": folder_size("/home/pi/zim"),
                "maps_gb": folder_size("/home/pi/maps"),
                "roms_gb": folder_size("/home/pi/pi-dashboard/.streamlit/static/roms"),
                "total_gb": round(total / (1024**3), 2),
                "used_gb": round(used / (1024**3), 2),
                "free_gb": round(free / (1024**3), 2)
            },
            "services": {
                "dashboard": check_port(8083),
                "maps": check_port(8091),
                "tileproxy": check_port(8087),
                "kiwix_core": check_port(8081),
                "kiwix_nice": check_port(8082),
                "game_server": check_port(9000)
            }
        }

        payload = json.dumps(data).encode()

        self.send_response(200)
        self.send_header("Content-Type", "application/json")

        # REQUIRED FOR DASHBOARD TO READ JSON
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET")
        self.send_header("Access-Control-Allow-Headers", "*")

        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

def run():
    server = HTTPServer(("0.0.0.0", STATUS_PORT), Handler)
    print(f"[PrepperZero Status] Serving on port {STATUS_PORT}")
    server.serve_forever()

if __name__ == "__main__":
    run()