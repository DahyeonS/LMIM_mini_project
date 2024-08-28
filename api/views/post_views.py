from flask import Blueprint, jsonify, request, send_from_directory, send_file
from datetime import datetime
import re; import os; import shutil
from bs4 import BeautifulSoup
from models import Post
from app import db

bp = Blueprint('post', __name__, url_prefix='/post')
UPLOAD_FOLDER = os.getcwd() + '/img' # 파일 절대 경로

def html_parse(html_text) :
    soup = BeautifulSoup(html_text, 'html.parser')
    return soup.get_text(separator='\n')

@bp.route('/load')
def load() :
    page = request.args.get('page', type=int, default=1)
    posts = Post.query.order_by(Post.postdate.desc()).paginate(page=page, per_page=10)
    
    data = [{'idx':p.idx, 'title':p.title, 'content':html_parse(p.content), 'photo':p.photo} for p in posts]
    result = {
        'items':data, 'hasPrev':posts.has_prev, 'hasNext':posts.has_next, 'page':page,
        'iterPages':list(posts.iter_pages()), 'prevNum':posts.prev_num, 'nextNum':posts.next_num
        }

    return jsonify(result)

@bp.route('/insert', methods=['POST'])
def insert() :
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    url = re.findall(r'<img src="([^"]+)"', content)
    files = [u.replace('./post/load_image?type=temp&amp;name=', '') for u in url]

    if files :
        for file in files :
            shutil.move(f'{UPLOAD_FOLDER}/temp/{file}', f'{UPLOAD_FOLDER}/uploads/{file}')

        for f in os.scandir(UPLOAD_FOLDER + '/temp') :
            os.remove(f.path)

        post = Post(title=title, content=content, photo=', '.join(files), postdate=datetime.now())
    else :
        post = Post(title=title, content=content, postdate=datetime.now())

    db.session.add(post)
    db.session.commit()

    return jsonify({'rs':1})

@bp.route('/upload', methods=['POST'])
def upload() :
    file = request.files['image']
    file.filename = re.sub('\W', '_', str(datetime.now()).split('.')[0]) + '_' + file.filename
    file.save(os.path.join(UPLOAD_FOLDER + '/temp', file.filename))
    return jsonify({'type':'temp', 'name':file.filename})

@bp.route('/load_image')
def load_image() :
    file_type = request.args.get('type')
    file_name = request.args.get('name')

    if file_type == 'static' :
        path = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
        return send_file(os.path.join(path + '/static', file_name + '.png'), as_attachment=True)

    return send_from_directory(UPLOAD_FOLDER + '/' + file_type, file_name)

@bp.route('/select')
def select() :
    return jsonify({'rs':0})

@bp.route('/update', methods=['GET', 'POST'])
def update() :
    return jsonify({'rs':0})

@bp.route('/delete', methods=['POST'])
def delete() :
    return jsonify({'rs':0})