import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";
var md = require("markdown-it")({
  html: true,
  linkify: true,
  typographer: true,
});

type Message = {
  content: string;
  role: "user" | "assistant";
};
export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<
    {
      title: string;
      messages: Message[];
    }[]
  >([]);

  const [chatList, setChatList] = useState<Message[]>([]);

  useEffect(() => {
    const chatHistoryCache = localStorage.getItem("chatHistory");
    if (chatHistoryCache) {
      setChatHistory(JSON.parse(chatHistoryCache));
    }
  }, []);

  //function to call api to send message
  const sendChat = async () => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      method: "POST",
      body: JSON.stringify({
        messages: chatList,
        model: "gpt-3.5-turbo",
      }),
    });
    const data = await response.json();
    return data;
  };

  const getTitle = async (messages: Message[]) => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      method: "POST",
      body: JSON.stringify({
        messages: messages,
        model: "gpt-3.5-turbo",
      }),
    });
    const data = await response.json();
    return data;
  };

  const addButtonCopyCodeOfPre = () => {
    const pre = document.querySelectorAll("pre");
    pre.forEach((item) => {
      const button = document.createElement("button");
      button.addEventListener("click", () => {
        //get text from code
        const text = item.querySelector("code")?.innerText || "";
        navigator.clipboard.writeText(text);
        //change style of button
        button.innerHTML = "Copied!";
        button.style.backgroundColor = "#919191";
        //0.5s later change back
        setTimeout(() => {
          button.innerHTML = "Copy";
          button.style.backgroundColor = "#677685";
        }, 500);
      });
      button.className = styles["copy-code"];
      button.innerHTML = "Copy";
      item.className = styles["code-block"];
      item.appendChild(button);
    });
  };

  useEffect(() => {
    if (chatList.length > 0) {
      addButtonCopyCodeOfPre();
      if (chatList[chatList.length - 1].role === "user") {
        setIsLoading(true);
        sendChat().then((data) => {
          console.log(data);
          const newChatList = [...chatList];
          newChatList.push(data.choices[0].message);
          setChatList(newChatList);
          //save to cache
          //update chat history
          if (selectedHistoryIndex !== null) {
            const newChatHistory = [...chatHistory];
            newChatHistory[selectedHistoryIndex].messages = newChatList;
            setChatHistory(newChatHistory);
            //save to cache
            localStorage.setItem("chatHistory", JSON.stringify(newChatHistory));
          }
          setIsLoading(false);
        });
      }
    }
    //after the fist response, call api again to get title of chat
    if (chatList.length === 2 && selectedHistoryIndex === null) {
      const newChatList = [...chatList];
      newChatList.push({
        content:
          "tóm tắt lại chủ đề của câu hỏi trên cách ngắn gọn nhất có thể, chỉ trả lời nội dung câu tóm tắt trong 1 câu",
        role: "user",
      });
      getTitle(newChatList).then((data) => {
        const newChatHistory = [...chatHistory];
        newChatHistory.unshift({
          title: data.choices[0].message.content,
          messages: chatList,
        });
        setChatHistory(newChatHistory);

        //save to cache
        localStorage.setItem("chatHistory", JSON.stringify(newChatHistory));

        setSelectedHistoryIndex(0);
      });
    }
    scrollToBottom();
  }, [chatList]);

  const onChatHistoryItemClick = (index: any) => {
    setSelectedHistoryIndex(index);
    setChatList(chatHistory[index].messages);
  };

  const sendMessage = () => {
    if (inputValue === "") return;
    const newChatList = [...chatList];
    newChatList.push({
      content: inputValue,
      role: "user",
    });

    //save to cache
    localStorage.setItem("chatList", JSON.stringify(newChatList));
    setInputValue("");

    //unfocus input
    const input = document.querySelector("textarea");
    input?.blur();

    setChatList(newChatList);
  };

  const newChat = () => {
    setChatList([]);
    setSelectedHistoryIndex(null);
    //focus on input
    const input = document.querySelector("textarea");
    input?.focus();
    localStorage.setItem("chatList", JSON.stringify([]));
  };

  const scrollToBottom = () => {
    //scroll to bottom of className chat-history-display-list
    const myChatList = document.querySelector(
      `.${styles["chat-history-display-list"]}`
    );
    myChatList?.scrollTo(0, myChatList.scrollHeight);
  };
  return (
    <>
      <Head>
        <title>My ChatGPT</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles["chatbot-container"]}>
          <div className={styles["chat-history"]}>
            <div className={styles["chat-history-menu"]}>
              <div className={styles["chat-history-item"]} onClick={newChat}>
                <AddIcon
                  style={{
                    marginRight: "10px",
                  }}
                />
                New chat
              </div>
            </div>
            <div className={styles["chat-history-conversation"]}>
              {chatHistory.map((chat, index) => {
                return (
                  <div
                    key={index}
                    className={
                      index === selectedHistoryIndex
                        ? styles["chat-history-item-selected"]
                        : styles["chat-history-item"]
                    }
                    onClick={() => onChatHistoryItemClick(index)}
                  >
                    {chat.title}
                  </div>
                );
              })}
            </div>
            <div className={styles["chat-history-menu-last"]}>
              <div
                className={styles["chat-history-item"]}
                onClick={() => {
                  setChatList([]);
                  setChatHistory([]);
                  localStorage.setItem("chatHistory", JSON.stringify([]));
                }}
              >
                <DeleteIcon
                  style={{
                    marginRight: "10px",
                  }}
                />
                Clear conversations
              </div>
              <div className={styles["chat-history-item"]}>
                <LogoutIcon
                  style={{
                    marginRight: "10px",
                  }}
                />
                Log out
              </div>
            </div>
          </div>
          <div className={styles["chat-history-display"]}>
            <div className={styles["chat-history-display-list"]}>
              {chatList.map((chat, index) => {
                var botMessage = md.render(chat.content);
                return (
                  <div key={index} className={styles["message-user"]}>
                    <div
                      className={
                        chat.role === "assistant"
                          ? styles["chatbot-bubble"]
                          : styles["user-bubble"]
                      }
                      dangerouslySetInnerHTML={{
                        __html: botMessage,
                      }}
                    >
                      {/* {chat.content} */}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles["input-panel"]}>
              {isLoading ? (
                <div className={styles["typing-indicator"]}>
                  <div className={styles["typing-text"]}>
                    Bot is typing answer
                  </div>
                  <div className={styles["typing-indicator-dot"]}></div>
                  <div className={styles["typing-indicator-dot"]}></div>
                  <div className={styles["typing-indicator-dot"]}></div>
                </div>
              ) : (
                <textarea
                  className={styles["input-field"]}
                  placeholder="Type your message"
                  rows={1}
                  onInput={(e) => {
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.height = "initial";
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                  }}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                ></textarea>
              )}

              {isLoading ? (
                <div></div>
              ) : (
                <button
                  className={styles["input-button"]}
                  onClick={sendMessage}
                >
                  Send
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
