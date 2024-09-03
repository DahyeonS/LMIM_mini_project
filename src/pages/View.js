import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css'
import { Viewer } from '@toast-ui/react-editor';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Fragment, useEffect, useState } from 'react';
import service from '../service';

// 잘못된 페이지 이동 방지
function useBlockNoData(index, navigate) {
    useEffect(() => {
        if (index !== 0) return;
        navigate('/post');
    }, [index, navigate]) // 페이지가 로드될 때 한 번만 실행
}

// 저장된 데이터 로드
function useData(index) {
    const [data, setData] = useState({}); // 불러온 데이터 반영

    useEffect(() => {
        if (index === 0) return;
        service.loadPost(index).then(
            (res) => {setData(res.data);} // 응답받은 값을 data에 저장
        )
    }, [index])

    return [data]; // 페이지가 로드될 때 한 번만 실행
}

function useCsrfToken() {
    const [csrfToken, setCsrfToken] = useState({}); // 불러온 CSRF 토큰 반영

    useEffect(() => {
        service.getCsrfToken().then(
            (res) => {setCsrfToken(res.data.csrf_token);} // CSRF 토큰 저장
        )
    }, []) // 페이지가 로드될 때 한 번만 실행

    return [csrfToken];
}

export default function View() {
    // 라우팅 부분
    const location = useLocation(null); // 현재 페이지 위치 추출
    const index = location.state ? location.state.idx : 0; // 현제 페이지 번호 추출
    const navigate = useNavigate(); // 페이지 이동
    useBlockNoData(index, navigate);
    
    // 출력값 처리 부분
    const [data] = useData(index);

    // 입력값 처리 부분
    const [csrfToken] = useCsrfToken();

    // 게시물 삭제
    const handleDelete = (e) => {
        e.preventDefault(); // 페이지 이동 방지

        if (window.confirm('정말로 삭제하시겠습니까?')) {
            service.deletePost(index, csrfToken).then(
                (res) => {
                    if (res.data.rs === 1) {
                        alert('정상적으로 삭제되었습니다.');
                        navigate('/post');
                    }
                }
            )
        }
    }

    // 화면 출력 부분
    return (
        <section className='container-fluid container-xl px-5'>
            <div className='pt-5 border-bottom'>
                <h1 className='pt-5 text-secondary fw-bold'>{data.title}</h1>
            </div>
            {index > 0 && (
                <Fragment>
                    {localStorage.getItem('token') ? ( // 관리자 로그인
                        <div className='pt-3 row'>
                            <div className='col-2'>
                                <Link className='btn btn-primary' to={'/post'}>목록보기</Link>
                            </div>
                            <div className='col-7'/>
                            <div className='col-3'>
                                <Link className='btn btn-primary ms-2 float-end' onClick={handleDelete}>삭제하기</Link>
                                <Link className='btn btn-primary float-end' to={'/write'} state={{idx:index}}>수정하기</Link>
                            </div>
                        </div>
                    ) : ( // 비로그인
                        <div className='pt-3'>
                            <Link className='btn btn-primary float-end' to={'/post'}>목록보기</Link>
                        </div>
                    )}
                    <div className='py-5'>
                        <Viewer initialValue={data.content} key={data.content}/>
                    </div>
                        {localStorage.getItem('token') ? ( // 관리자 로그인
                            <div className='border-top row pt-2 pb-5'>
                                <div className='col-2'>
                                    <Link className='text-secondary' to={'/post'}>목록보기</Link>
                                </div>
                                <div className='col-7'/>
                                <div className='col-3'>
                                    <Link className='text-secondary ms-2 float-end' onClick={handleDelete}>삭제하기</Link>
                                    <Link className='text-secondary float-end' to={'/write'}>수정하기</Link>
                                </div>
                            </div>
                        ) : ( // 비로그인
                            <div className='border-top pt-2 pb-5'>
                                <Link className='text-secondary float-end' to={'/post'}>목록보기</Link>
                            </div>
                        )}
                </Fragment>
            )}
        </section>
    );
}