import os
import random
import time
from flask import Flask, render_template, jsonify, request
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
    start = int(request.args.get('start', 0))
    stop = int(request.args.get('stop', start + 25))
    return jsonify(objects=get_objects(request.args.get('search'))[start:stop])


def generate_name():
    return ''.join(random.choice('abcdefghijklmnopqrstuvwxyz') for x in range(10))


objects = [{'id': x + 1, 'name': generate_name()} for x in range(200)]


def get_objects(search):
    return [x for x in objects if search in x['name']] if search else objects


if __name__ == '__main__':
    app.run(debug=True)
