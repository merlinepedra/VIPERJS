import React, { Fragment, memo, useEffect, useRef } from 'react';

import { ClearOutlined, InteractionOutlined } from '@ant-design/icons';

import { Button, Input, Select, Space, Tabs, Typography } from 'antd';
import copy from 'copy-to-clipboard';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import './xterm.css';
import { getToken } from '@/utils/authority';
import styles from '@/pages/Core/MsfConsoleXTerm.less';

const { Text } = Typography;
const { Paragraph } = Typography;
const { Option } = Select;
const ButtonGroup = Button.Group;
const { Search, TextArea } = Input;
const { TabPane } = Tabs;

//websocket连接地址设置
let webHost = '127.0.0.1:8002';
let protocol = 'ws://';
if (process.env.NODE_ENV === 'production') {
  webHost = location.hostname + (location.port ? `:${location.port}` : '');
  protocol = 'wss://';
} else {
  webHost = '127.0.0.1:8002';
  protocol = 'ws://';
}

const Msfconsole = props => {
  console.log('Msfconsole');
  const fitAddon = useRef(new FitAddon());
  const msfConsoleTerm = useRef(null);
  const wsmsf = useRef(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    initMsfconsole();
    return () => {
      try {
        wsmsf.current.close();
        msfConsoleTerm.current.close();
        msfConsoleTerm.current.dispose();
      } catch (error) {
      }
    };
  }, []);

  const clearConsole = () => {
    msfConsoleTerm.current.clear();
  };
  const resetBackendConsole = () => {
    const sendMessage = { status: 0, cmd: 'reset' };
    const sendData = JSON.stringify(sendMessage);
    wsmsf.current.send(sendData);
  };

  const initMsfconsole = () => {
    const urlargs = `&token=${getToken()}`;
    const urlpatternsMsf = '/ws/v1/websocket/msfconsole/?';
    const socketUrlMsf = protocol + webHost + urlpatternsMsf + urlargs;
    wsmsf.current = new WebSocket(socketUrlMsf);

    wsmsf.current.onopen = () => {
      if (msfConsoleTerm.current === null) {
        msfConsoleTerm.current = new Terminal({
          allowTransparency: false,
          useStyle: true,
          cursorBlink: true,
        });

        msfConsoleTerm.current.attachCustomKeyEventHandler(e => {
          if (e.keyCode === 39 || e.keyCode === 37) {
            return false;
          }
          return !(e.keyCode === 45 || e.keyCode === 36);

        });
      }

      msfConsoleTerm.current.open(terminalRef.current);
      msfConsoleTerm.current.loadAddon(fitAddon.current);
      fitAddon.current.fit();

      msfConsoleTerm.current.onData(data => {
        const sendMessage = { status: 0, data };
        const sendData = JSON.stringify(sendMessage);
        wsmsf.current.send(sendData);
      });
      msfConsoleTerm.current.onSelectionChange(e => {
        if (msfConsoleTerm.current.hasSelection()) {
          copy(msfConsoleTerm.current.getSelection());
        }
      });

      const firstMessage = { status: 0, data: '\r' };
      const firstData = JSON.stringify(firstMessage);
      wsmsf.current.send(firstData);
    };

    wsmsf.current.onclose = CloseEvent => {
      try {
        msfConsoleTerm.current.close();
        msfConsoleTerm.current.dispose();
      } catch (error) {
      }
    };

    wsmsf.current.onmessage = event => {
      const recv_message = JSON.parse(event.data);
      msfConsoleTerm.current.write(recv_message.data);
    };
  };

  return (
    <div
      className={styles.msfconsolediv}
      ref={terminalRef}
    >
      <Space
        style={{
          top: 'calc(8vh)',
          right: 8,
          position: 'absolute',
          zIndex: 10000,
        }}
        direction="vertical"
      >
        <Button
          style={{
            backgroundColor: 'rgba(40,40,40,0.7)',
          }}
          size="large"
          onClick={() => clearConsole()}
          icon={<ClearOutlined/>}
        />
        <Button
          style={{
            backgroundColor: 'rgba(40,40,40,0.7)',
          }}
          size="large"
          icon={<InteractionOutlined/>}
          onClick={() => resetBackendConsole()}
        />
      </Space>
    </div>
  );
};

const MsfConsoleXTermMemo = memo(Msfconsole);

export default MsfConsoleXTermMemo;