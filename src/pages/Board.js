import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css'
import { useState, useRef, useEffect, Fragment } from 'react';
import service from '../service';
import { Link, useLocation } from 'react-router-dom';

// 모바일 확인
function UseIsMoblie() {
    const [isMobile, setIsMobile] = useState(false); // 모바일 상태 반영

    useEffect(() => {
        if (typeof window) {
            if (window.innerWidth > 768) setIsMobile(false);
            else setIsMobile(true);
        }
    }, []) // 페이지가 로드될 때 한 번만 실행

    return isMobile;
}

// 저장된 데이터 로드
function useData() {
    const [data, setData] = useState({}); // 불러온 데이터 상태 반영
    const location = useLocation(null); // 현재 페이지 위치 추출
    const page = location.state ? location.state.page : 1; // 현제 페이지 번호 추출

    useEffect(() => { // 페이지 로드시 실행
        service.getBoard(page).then( // 플라스크에서 데이터를 가져옴
            (res) => {setData(res.data);} // 응답받은 값을 data에 저장
        )
    }, [page]) // 페이지가 변경될 때마다 한 번만 실행

    return data;
}

function useCsrfToken() {
    const [csrfToken, setCsrfToken] = useState({}); // 불러온 CSRF 토큰 반영

    useEffect(() => {
        // CSRF 토큰
        service.getCsrfToken().then(
            (res) => {setCsrfToken(res.data.csrf_token);} // CSRF 토큰 저장
        )
    }, []) // 페이지가 로드될 때 한 번만 실행

    return csrfToken;
}

function useValues() {
    const [values, setValues] = useState({}); // 입력값 반영

    useEffect(() => {
        if (!localStorage.getItem('token')) return; // 비로그인시 적용 X
    
        setValues((prevValues) => ({ // values의 값을 갱신
            ...prevValues, // 이전에 입력된 값을 복사
            username: '관리자', // username을 '관리자'로 설정
            password: 'admin' // password를 임의로 설정
        }))
    }, []) // 페이지가 로드될 때 한 번만 실행

    return [values, setValues];
}

function useIsDisabled() {
    const [isDisabled, setIsDisabled] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('token')) setIsDisabled(true); // 로그인시 적용
        else setIsDisabled(false);
    }, []) // 페이지가 로드될 때 한 번만 실행

    return isDisabled;
}

export default function Board() {
    // 출력값 처리 부분
    const data = useData();
    const isMobile = UseIsMoblie();
    
    // 입력값 처리 부분
    const csrfToken = useCsrfToken();
    const [values, setValues] = useValues();
    const isDisabled = useIsDisabled();
    const [password, setPassword] = useState({}); // 비밀번호 입력값 반영
    const [showPasswordInput, setShowPasswordInput] = useState(null); // 비밀번호 입력 필드

    const inputNameFocus = useRef(null); // 유저명 참조
    const inputPwFocus = useRef(null); // 비밀번호 참조
    const inputContentFocus = useRef(null); // 내용 참조
    const inputDeletePwFocus = useRef(null); // 방명록 삭제 비밀번호 참조

    // 방명록 입력값이 변경될 때마다 자동으로 상태를 갱신
    const handleChange = (e) => {
        const {name, value} = e.target; // 입력값의 name, value 추출
        setValues((prevValues) => ({ // values의 값을 갱신
            ...prevValues, // 이전에 입력된 값을 복사
            [name]: value // 새로운 값을 추가하거나 갱신된 값을 적용
        }))
    };

    // 제출 처리 함수
    const handleSubmit = async(e) => {
        e.preventDefault(); // 페이지 변경 방지

        // 빈 공간이 있을 시 전송 X
        if (!values.username || !values.password || !values.content || (!localStorage.getItem('token') && values.username === '관리자')) {
            if (!values.username) {
                alert('이름을 입력해주세요.');
                inputNameFocus.current.focus(); // 유저명에 포커스
            }
            else if (!values.password) {
                alert('비밀번호를 입력해주세요.');
                inputPwFocus.current.focus(); // 비밀번호에 포커스
            }
            else if (!values.content) {
                alert('내용을 입력해주세요.');
                inputContentFocus.current.focus(); // 내용에 포커스
            } else {
                alert('해당 이름은 설정할 수 없습니다.');
                inputNameFocus.current.focus(); // 유저명에 포커스
            }
            
            return;
        }

        // DB 저장 함수 호출
        service.createBoard(values, csrfToken).then(
            (res) => { // 응답이 성공했을 때
                if (res.data.rs === 1) { // 응답받은 값의 rs가 1일 때
                    alert('방명록이 작성되었습니다.');
                    window.location.reload(); // 새로고침
                }
            }
        )
    };

    // 삭제할 방명록의 인덱스 값 설정
    const handleShowPasswordInput = (idx) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            setShowPasswordInput(idx);
            setPassword(''); // 비밀번호 값 초기화
        }
    }

    // 비밀번호 입력값이 변경될 때마다 자동으로 상태를 갱신
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    }

    // 방명록 삭제
    const handleDelete = (idx) => {
        service.deleteBoard(idx, password, csrfToken).then(
            (res) => {
                if (res.data.rs === 1) {
                    alert('정상적으로 삭제되었습니다.');
                    window.location.reload();
                } else {
                    alert('비밀번호를 올바르게 입력하세요.');
                    inputDeletePwFocus.current.focus();
                }
            }
        )
    }
    
    // 관리자용 방명록 삭제
    const handleDeleteAdmin = (idx) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            service.deleteBoardAdmin(idx, csrfToken).then(
                (res) => {
                    if (res.data.rs === 1) {
                        alert('정상적으로 삭제되었습니다.');
                        window.location.reload();
                    }
                }
            )
        }
    }

    // 화면 출력 부분
    return (
        <section className='container-fluid container-xl px-5 rounded'>
            <div className='pt-5 mb-5 border-bottom'>
                <h1 className='pt-5 text-secondary fw-bold fst-italic'>방명록</h1>
            </div>
            {/* 방명록 작성 폼 */}
            <form className='row g-2 mb-5' onSubmit={handleSubmit}>
                <div className='col-12 col-md-6'>
                    <input type='text' className='form-control' name='username' placeholder='Name' onChange={handleChange} ref={inputNameFocus} disabled={isDisabled} maxLength={30}/>
                </div>
                <div className='col-12 col-md-6'>
                    <input type='password' className='form-control' name='password' placeholder='Password' onChange={handleChange} ref={inputPwFocus} disabled={isDisabled} maxLength={150}/>
                </div>
                <div className='col-12'>
                    <input type='text' className='form-control py-5' name='content' onChange={handleChange} ref={inputContentFocus} maxLength={500}/>
                </div>
                <div className='col-8 col-md-9 col-lg-10'/>
                <div className='col-4 col-md-3 col-lg-2'>
                    <input type='submit' className='btn btn-primary w-100 py-2' value={'작성'}/>
                </div>
            </form>
            {/* 방명록 목록 */}
            {Array.isArray(data.items) ?
                <div className='py-3'>
                    {data.items.map(item => 
                        <Fragment key={`board-${item.idx}`}>
                            <div className='row g-3 border-top py-5 mb-2'>
                                <div className='col-12 col-md-6 col-lg-2' style={{marginTop:0}}>
                                    {item.username.length <= 15 ? 
                                        <h6 className='fw-bold' style={{marginTop:7}}>{item.username}</h6>
                                    : 
                                        <h6 className='fw-bold' dangerouslySetInnerHTML={{ __html: item.username.match(/.{1,15}/g).join('<br/>') }}/>
                                    }
                                </div>
                                <div className='col-12 col-md-6 col-lg-5 mt-2 text-break'>
                                    <h6>{item.content}</h6>
                                </div>
                                <div className='col-12 col-md-6 col-lg-2 mt-2'>
                                    <h6 className='fst-italic text-secondary opacity-50 board-lower'>{item.postdate}</h6>
                                </div>
                                {/* 삭제 버튼 */}
                                {localStorage.getItem('token') ? /* 로그인 상태일 경우 */
                                    <Fragment>
                                        <div className='col-8 col-md-4 col-lg-2 board-lower'/>
                                        <div className='col-4 col-md-2 col-lg-1 px-3 board-delete'>
                                            <button onClick={() => handleDeleteAdmin(item.idx)} className='btn btn-primary'>삭제</button>
                                        </div>
                                    </Fragment>
                                : /* 로그인 상태가 아닐 경우 */
                                    <Fragment>
                                        {showPasswordInput === item.idx ? /* 삭제할 방명록의 인덱스 값과 일치할 경우 */
                                            <Fragment>
                                                <div className='col-8 col-md-4 col-lg-2 board-delete'>
                                                    <input type='password' onChange={handlePasswordChange} className='form-control' placeholder='비밀번호 확인' ref={inputDeletePwFocus}/>
                                                </div>
                                                <div className='col-4 col-md-2 col-lg-1 board-delete'>
                                                    <button onClick={() => handleDelete(item.idx)} className='btn btn-primary ms-2'>삭제</button>
                                                </div>
                                            </Fragment>
                                        : 
                                            <Fragment>
                                                {item.username !== '관리자' ? /* 관리자가 작성한 글이 아닐 경우 */
                                                    <Fragment>
                                                        <div className='col-8 col-md-4 col-lg-2 board-lower'/>
                                                        <div className='col-4 col-md-2 col-lg-1 px-3 board-delete'>
                                                            <button className='btn btn-primary' onClick={() => handleShowPasswordInput(item.idx)}>삭제</button>
                                                        </div>
                                                    </Fragment>
                                                : /* 관리자가 작성한 글인 경우*/
                                                    <div className='col-12 col-md-6 col-lg-3 board-lower'/>
                                                }
                                            </Fragment>
                                        }
                                    </Fragment>
                                }
                            </div>
                            {item.num === data.items.length && 
                                <div className='row g-3 pt-5 border-top'/>
                            }
                        </Fragment>
                    )}
                    {/* 페이징 */}
                    {data.items.length > 0 &&
                        <ul className='pagination justify-content-center py-5 mb-4'>
                            {isMobile ? // 모바일
                                <Fragment>
                                    {/* 처음 */}
                                    {data.hasPrev ? 
                                        <Fragment>
                                            <li className='page-item'>
                                                <Link className='page-link text-secondary' state={{page:1}}>{'<<'}</Link>
                                            </li>
                                        </Fragment>
                                    :
                                        <Fragment>
                                            <li className='page-item disabled'>
                                                <Link className='page-link' aria-disabled='true'>{'<<'}</Link>
                                            </li>
                                        </Fragment>
                                    }
                                    {/* 페이지 번호 */}
                                    {data.iterPages.map(pageNum => 
                                        <Fragment key={`paging-${pageNum || Math.random()}`}>
                                        {pageNum !== null && pageNum < data.page + 3 && pageNum > data.page - 3 &&
                                            <Fragment key={`paging-fragment-${pageNum || Math.random()}`}>
                                            {pageNum !== data.page ? 
                                                <li className='page-item' >
                                                    <Link className='page-link text-secondary' state={{page:pageNum}}>{pageNum}</Link>
                                                </li>
                                            : 
                                                <li className='page-item active' aria-current='page'>
                                                    <Link className='page-link' style={{backgroundColor:'rgba(119, 182, 202, 0.9)', border:'rgba(119, 182, 202, 0.9)'}} tabIndex={-1} onClick={(e) => e.preventDefault()}>{pageNum}</Link>
                                                </li>                            
                                            }
                                            </Fragment>
                                        }
                                        </Fragment>
                                    )}
                                    {/* 마지막 */}
                                    {data.hasNext ? 
                                        <li className='page-item'>
                                            <Link className='page-link text-secondary' state={{page:data.iterPages[data.iterPages.length-1]}}>{'>>'}</Link>
                                        </li>
                                    :
                                        <li className='page-item disabled'>
                                            <Link className='page-link' tabIndex={-1} aria-disabled='true'>{'>>'}</Link>
                                        </li>
                                    }
                                </Fragment>
                            : // 데스크톱
                                <Fragment>
                                    {/* 이전 */}
                                    {data.hasPrev ? 
                                        <li className='page-item'>
                                            <Link className='page-link text-secondary' state={{page:data.prevNum}}>이전</Link>
                                        </li>
                                    :
                                        <li className='page-item disabled'>
                                            <Link className='page-link' aria-disabled='true'>이전</Link>
                                        </li>
                                    }
                                    {/* 페이지 번호 */}
                                    {data.iterPages.map(pageNum => 
                                        <Fragment key={`paging-${pageNum || Math.random()}`}>
                                            {pageNum !== null ?
                                                <Fragment key={`paging-fragment-${pageNum || Math.random()}`}>
                                                    {pageNum !== data.page ? 
                                                        <li className='page-item' >
                                                            <Link className='page-link text-secondary' state={{page:pageNum}}>{pageNum}</Link>
                                                        </li>
                                                    : 
                                                        <li className='page-item active' aria-current='page'>
                                                            <Link className='page-link' style={{backgroundColor:'rgba(119, 182, 202, 0.9)', border:'rgba(119, 182, 202, 0.9)'}} tabIndex={-1} onClick={(e) => e.preventDefault()}>{pageNum}</Link>
                                                        </li>                            
                                                    }
                                                </Fragment>
                                            : 
                                                <li className='disabled'>
                                                    <Link className='page-link'>...</Link>
                                                </li>
                                            }
                                        </Fragment>
                                    )}
                                    {/* 다음 */}
                                    {data.hasNext ? 
                                        <li className='page-item'>
                                            <Link className='page-link text-secondary' state={{page:data.nextNum}}>다음</Link>
                                        </li>
                                    : 
                                        <li className='page-item disabled'>
                                            <Link className='page-link' tabIndex={-1} aria-disabled='true'>다음</Link>
                                        </li>
                                    }
                                </Fragment>
                            }
                        </ul>
                    }
                </div>
            :
                // 로딩 대기 문구
                <div className='py-5'>
                    <h4 className='text-secondary text-center fst-italic pb-5 opacity-50'>데이터가 아직 로드되지 않았습니다.</h4>
                </div>
            }
        </section>
    );
}
