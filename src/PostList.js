import React, { useEffect, useState, useContext } from 'react';
import { usePostState, usePostDispatch, getPost } from './PostContext';
import axios from 'axios';
import { BsThreeDots } from 'react-icons/bs';
import { FiTrash2, FiEdit3 } from 'react-icons/fi';
import { ThemeContext } from 'styled-components';

// todo: 순서 역순에 무한 스크롤 구현

let updateList = null;

function PostList() {
  const state = usePostState();
  const dispatch = usePostDispatch();
  const { data, loading, error } = state.postList;

  const fetch = () => {
    getPost(dispatch);
  };

  useEffect(() => {
    fetch();
  }, []);

  // 외부에서 fetch 호출을 위한 함수
  updateList = () => {
    fetch();
  };

  if(loading || !data) { return <div>Loading...</div> };
  if(error) { return <div>Error occur</div> };
  return (
    <div className="post-list">
      {data.map((item, idx) => {
        return (<PostItem key={item._id} data={item}></PostItem>);
      })}
    </div>
  );
}

export { updateList };

function PostItem(props) {
  // init using data from props
  const [data, setData] = useState(props.data);
  const [isMine, setIsMine] = useState(true); // props로 확인 
  const { palette } = useContext(ThemeContext);

  // update post(when comment state changed)
  const updatePost = async () => {
    const res = await axios.get(`http://localhost:3002/api/posts/${data._id}`);
    setData(res.data[0]);
  };

  // modify button
  const [modifyToggle, setModifyToggle] = useState(false);
  const handleModify = () => {
  };

  // like button
  const handleLike = async () => {
    await axios.put(`http://localhost:3002/api/posts/${data._id}/like`);
    updatePost();
  };

  // delete button
  const handleDel = async () => {
    await axios.delete(`http://localhost:3002/api/posts/${data._id}`);
    updateList();
  };

  // comment
  const [cmt, setCmt] = useState('');
  const handleCmtChange = (e) => {
    setCmt(e.target.value);
  };
  const cmtSubmit = async () => {
    // todo: current user 동적으로 
    await axios.post(`http://localhost:3002/api/posts/${data._id}/comments`, { author: 'current user', comment: cmt });
    setCmt('');
    updatePost();
  };
  const handleDelCmt = (idx) => {
    return async () => {
      await axios.delete(`http://localhost:3002/api/posts/${data._id}/comments/${idx}`);
      updatePost();
    };
  }

  const [menuToggle, setMenuToggle] = useState(false);
  const postMenu = () => {
    setMenuToggle(!menuToggle);
  };

  // todo: 현재 사용자와 포스트 글쓴이가 같다면 ... 눌러서 수정, 삭제
  return (
    <div className="post-item post">
      <div className="upper">
        <div className="wrap-img">
          <img src={process.env.PUBLIC_URL + '/person-icon.png'} alt="profile" />
        </div>
        <div className="wrap-author">
          <div className="author">{data.author}</div>
          <div className="date">4시간</div>
        </div>
        {isMine &&
        <div class="wrap-wrap-icon">
          <div class="wrap-icon btn" onClick={postMenu}>
            <BsThreeDots color={palette.gray} size="20px" />
          </div> 
        </div>
        }
        {menuToggle &&
        <div class="post-menu">
          <div className="modify btn" onClick={handleModify}>
            <div className="wrap-icon"><FiEdit3 /></div>
            <div className="text-icon"><span>수정하기</span></div>
          </div>
          <div className="delete btn" onClick={handleDel}>
            <div className="wrap-icon"><FiTrash2 /></div>
            <div className="text-icon"><span>삭제하기</span></div>
          </div>
        </div>
        }
      </div>
      <div className="middle">
        <div className="content">{data.content}</div>
        <div className="like">LIKE : {data.like}</div>
      </div>
      <div className="buttons">
        <button onClick={handleLike}>Like</button>
      </div>
      <div className="lower">
        {data.comments ? data.comments.map((cmt, idx) => {
          return (
            <div key={idx}>{cmt.author}: {cmt.comment}<button onClick={handleDelCmt(idx)}>X</button></div>
          );
        }) : null }
        <input type="text" value={cmt} onChange={handleCmtChange} />
        <button onClick={cmtSubmit}>COMMENT</button>
      </div>
    </div>
  );
}
// todo: hashtag, 검색까지

export default PostList;

