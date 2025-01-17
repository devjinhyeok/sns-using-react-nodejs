import React, { useState, useEffect, useRef, createContext, useReducer, useContext, useCallback } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { useAuthState } from './AuthContext';
import { SocketContext } from './socket';
import { VscClose } from 'react-icons/vsc'; 
import moment from 'moment';
import dotenv from 'dotenv';
dotenv.config();

const ChatDiv = styled.div`
  position: fixed;
  bottom: 0px;
  right: 100px;
  background:  ${props=>props.theme.palette.white};;
  width: 400px;
  height: 500px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  z-index: 5;

  & * {
    display: flex;
  }

  .upper {
    border-radius: 10px;
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
    color: ${props=>props.theme.palette.white};
    background-color: ${props=>props.theme.palette.blue};
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
    height: 30px;
    padding: 10px 12px;
    align-items: center;
    justify-content: space-between;
    font-size: 20px;
  }
  .middle {
    flex: 1;
    flex-direction: column;
    overflow: auto;
    margin: 0 10px;
  }
  .middle {
    -ms-overflow-style: none; 
    scrollbar-width: none; 
  }
  .middle::-webkit-scrollbar {
    display: none;
  }
  .middle .msg {
    margin-top: 10px;
  }
  .middle .msg.right {
    justify-content: flex-end;
  }
  .middle .msg.right + .msg.right {
    margin-top: 3px;
    .wrap-date {
      display: none;
    }
  }
  .middle .msg.left + .msg.left {
    margin-top: 3px;
    .wrap-date {
      display: none;
    }
    .wrap-profile img {
      display: none;
    }
  }
  .middle .wrap-date {
    align-items: center;
    color: ${props=>props.theme.palette.gray};
    font-size: 13px;
    margin: 0 5px;
  }
  .middle .wrap-profile {
    height: 40px;
    width: 40px;
    border-radius: 40px;
    overflow: hidden;
  }
  .middle .wrap-profile img {
    height: 100%;
    width: 100%;
    object-fit: cover;
  }
  .middle .wrap-text {
    border-radius: 20px;
    min-height: 24px;
    max-width: 200px;
    padding: 8px 12px;
    align-items: center;
  }
  .middle .wrap-text.left {
    background: ${props=>props.theme.palette.lightDarkGray};
    color: ${props=>props.theme.palette.black};
  }
  .middle .wrap-text.right {
    background: ${props=>props.theme.palette.blue};
    color: ${props=>props.theme.palette.white};
  }
  .lower {
    border-top: 1px soild ${props=>props.theme.palette.gray};
    padding: 8px 12px;
    font-size: 16px;
    height: 30px;
  }
  .lower input {
    width: 100%;
    color: ${props=>props.theme.palette.black};
  }
`;

function Chat() {
  const authState = useAuthState();
  const socket = useContext(SocketContext);
  const [msg, setMsg] = useState('');
  const [state, dispatch] = useChatContext();
  const middleDom = useRef();
  useEffect(() => {
    if(state.visible) {
      scrollToBottom();
    }
  }, [state.visible, state.chatLog]);
  const stateIdRef = useRef();
  const userInfoRef = useRef();
  useEffect(() => {
    stateIdRef.current = state.id;
    userInfoRef.current = authState.userInfo;
  }, [state.id, authState.userInfo])
  useEffect(() => {
    socket.on('receive msg', (data) => {
      if(!userInfoRef.current) return;
      if(data.fromId !== stateIdRef.current && userInfoRef.current.id !== data.fromId) {
        return;
      }
      const receive = {
        isMe: data.isMe,
        msg: data.msg,
        date: moment(data.date).fromNow()
      };
      dispatch({ type: 'CHAT_UPDATE', newChatLog: receive });
      // }
      scrollToBottom();
    });
  }, []);
  const scrollToBottom = () => {
    if(!middleDom.current) return;
    middleDom.current.scrollTop = middleDom.current.scrollHeight;
  };
  const onMsgChange = (e) => {
    setMsg(e.target.value);
  };
  const sendMsg = useCallback((e) => {
    if(e.key !== 'Enter' || e.target.value === '' || !socket) return;
    socket.emit('send msg', {
      fromId: authState.userInfo.id,
      toId: state.id,
      msg: msg
    });
    setMsg('');
    scrollToBottom();
  }, [authState.userInfo, state.id, msg, socket]);

  if(!state.visible) return null;
  return (
    <ChatDiv>
      <div className="upper">
        <div className="who-text">{state.name}</div>
        <div className="close btn" onClick={() => chatOff(dispatch)}>
          <VscClose />
        </div>
      </div>
      <div className="middle" ref={middleDom}>
        {
          state.chatLog && state.chatLog.length ? 
            state.chatLog.map((log, idx) => 
              log.msg === 'd#u#m#m#y' ? null :
              log.isMe ?
                <div className="msg right" key={idx}>
                  <div className="wrap-date">{log.date}</div>
                  <div className="wrap-text right">{log.msg}</div>
                </div>
                :
                <div className="msg left" key={idx}>
                  <div className="wrap-profile">
                    <img src={state.profile} alt='profile' />
                  </div>
                  <div className="wrap-text left">{log.msg}</div>
                  <div className="wrap-date">{log.date}</div>
                </div>
            ) : null
        }
      </div>
      <div className="lower">
        <input autoFocus type="text" placeholder="메세지를 입력하세요." onKeyPress={sendMsg} value={msg} onChange={onMsgChange}/>
      </div>
    </ChatDiv>
  );
}

const initialState = {
  id: null,
  name: null,
  profile: null,
  visible: false,
  chatLog: []
};

const chatReducer = (state, action) => {
  // console.log(action);
  switch(action.type) {
    case 'CHAT_ON': 
      return { id: action.id, visible: action.visible, name: action.name, profile: action.profile, chatLog: action.chatLog };
    case 'CHAT_OFF':
      return initialState;
    case 'CHAT_UPDATE':
      if(state.chatLog === null || state.chatLog.length === 0) {
        return { ...state, chatLog: [action.newChatLog] };
      }
      return { ...state, chatLog: state.chatLog.concat(action.newChatLog) };
    default:
      // console.log('call default');
      return state;
  }
};

const ChatStateContext = createContext(null);
const ChatDispatchContext = createContext(null);

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  return (
    <ChatStateContext.Provider value={state}>
      <ChatDispatchContext.Provider value={dispatch}>
        {children}
      </ChatDispatchContext.Provider>
    </ChatStateContext.Provider>
  );
}

export function useChatContext() {
  const state = useContext(ChatStateContext);
  const dispatch = useContext(ChatDispatchContext);
  if(!state || !dispatch) {
    throw new Error('need context provider');
  }
  return [state, dispatch];
}

export async function chatOn(dispatch, id, name, myId) {
  // console.log('call chatOn');
  const profile = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api/users/${id}/profile`);
  const chatLog = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api/users/${myId}/chat/${id}`)
  // console.log('chatLog', chatLog);
  dispatch({ type: 'CHAT_ON', id: id, name: name, profile: profile.data, chatLog: chatLog.data, visible: true });
}
export function chatOff(dispatch) {
  dispatch({ type: 'CHAT_OFF' });
}

export default React.memo(Chat);
