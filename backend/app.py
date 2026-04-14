from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Server is running... We are up!"

if __name__ == "__main__":
    app.run(debug=True)