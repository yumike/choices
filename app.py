import os
import random
import time
from flask import Flask, render_template, jsonify
from flask_gears import Gears


NODE_PATH = os.path.join(os.path.dirname(__file__), 'node_modules')
os.environ['NODE_PATH'] = os.path.normpath(os.path.abspath(NODE_PATH))


app = Flask(__name__)
gears = Gears(app)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/clients')
def clients():
    time.sleep(1)  # imitate server delay
    objects = [{'id': x, 'name': generate_name()} for x in range(1, 101)]
    return jsonify(objects=objects)


def generate_name():
    return ''.join(random.choice('abcdefghijklmnopqrstuvwxyz') for x in range(10))


if __name__ == '__main__':
    app.run(debug=True)
