"use client"
import { Box, Button, Stack, TextField } from '@mui/material';
import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi, I am a mental health assistant. How can I be of service today?' },
  ]);
  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    setMessages((messages) => [...messages, { role: 'user', content: message }]);
    setMessage('');

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, { role: 'user', content: message }]),
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          console.log('Final', result);
          setMessages((messages) => [
            ...messages,
            { role: 'assistant', content: result },
          ]);
          return result;
        }
        const text = decoder.decode(value || new Int8Array(), { stream: true });
        console.log(text);
        result += text;
        return reader.read().then(processText);
      });
    });
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems={'center'}
    >
      <Stack
        direction={'column'}
        width={'500px'}
        height={'700px'}
        border={"1px solid black"}
        p={2}
        spacing={3}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow={"auto"}
          maxHeight={"100%"}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display={'flex'}
              justifyContent={
                message.role === 'assistant'
                  ? 'flex-start'
                  : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'primary.main'
                    : 'secondary.main'
                }
                color='white'
                borderRadius={16}
                p={3}
                maxWidth={'80%'}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button variant='contained' onClick={sendMessage}>Send</Button>
        </Stack>
      </Stack>
    </Box>
  );
}