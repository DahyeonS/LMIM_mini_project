from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from models import Memo
from app import db

bp = Blueprint('memo', __name__, url_prefix='/memo')

@bp.route('/load')
def load() :
    page = request.args.get('page', type=int, default=1)
    memos = Memo.query.order_by(Memo.postdate.desc()).paginate(page=page, per_page=10)

    data = [{'idx':m.idx, 'username':m.username, 'content':m.content} for m in memos]
    result = {
        'items':data, 'hasPrev':memos.has_prev, 'hasNext':memos.has_next, 'page':page,
        'iterPages':list(memos.iter_pages()), 'prevNum':memos.prev_num, 'nextNum':memos.next_num
        }

    return jsonify(result)

@bp.route('/insert', methods=['POST'])
def insert() :
    data = request.get_json()
    memo = Memo(
        username=data.get('username'),
        pw=generate_password_hash(data.get('password')),
        content=data.get('content'),
        postdate=datetime.now()
        )
    
    db.session.add(memo)
    db.session.commit()

    return jsonify({'rs':1})

@bp.route('/delete', methods=['POST'])
def delete() :
    rs = 0
    data = request.get_json()
    idx = data.get('idx')
    pw = data.get('password')

    if check_password_hash(Memo.query.get(idx).pw, pw) :
        db.session.delete(Memo.query.get(idx))
        db.session.commit()
        rs = 1
    
    return jsonify({'rs':rs})

@bp.route('/delete/delete_admin')
def delete_admin() :
    rs = 0
    return jsonify({'rs':rs})