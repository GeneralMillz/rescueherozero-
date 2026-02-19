from flask import Flask, Response, request
import requests

app = Flask(__name__)

# mbtileserver backend
TILESERVER = "http://127.0.0.1:8091"

# Accept both .pbf and .pbf?query=... to avoid Flask 404s
@app.route("/tiles/<state>/<int:z>/<int:x>/<int:y>.pbf", methods=["GET", "OPTIONS"])
@app.route("/tiles/<state>/<int:z>/<int:x>/<int:y>", methods=["GET", "OPTIONS"])
def proxy_tile(state, z, x, y):

    # Handle OPTIONS preflight
    if request.method == "OPTIONS":
        resp = Response(status=200)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return resp

    # Forward GET request to mbtileserver with timeout
    url = f"{TILESERVER}/services/{state}/tiles/{z}/{x}/{y}.pbf"
    try:
        r = requests.get(url, timeout=2)
    except requests.exceptions.RequestException:
        return Response(status=502)

    # Pass through mbtileserver response
    resp = Response(
        r.content,
        status=r.status_code,
        content_type="application/x-protobuf"
    )

    # Required CORS headers
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"

    return resp


@app.route("/")
def root():
    return "Tile proxy running"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8087, threaded=True)