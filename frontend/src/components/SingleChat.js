import { FormControl, Input, Box, Text, IconButton, Spinner, useToast } from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";
import "./styles.css";

const ENDPOINT = "http://localhost:4500";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [username, setTypingUsername] = useState("");
  const [load, hasLoad] = useState(false);
  const toast = useToast();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const { selectedChat, setSelectedChat, user, notification, setNotification } = ChatState();

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(`/message/all/${selectedChat._id}`, config);
      setMessages(data);
      setLoading(false);

      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socket.emit("typing", { room: selectedChat._id, username: user.data.name });
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post("/message/send", {
          content: newMessage,
          chatId: selectedChat,
        }, config);
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occurred!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };
  

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", ({ username }) => {
      setIsTyping(true);
      setTypingUsername(username);
    });
    socket.on("stop typing", () => setIsTyping(false));
    socket.on("message unsent", ({ messageId, chatId }) => {
      if (selectedChat && selectedChat._id === chatId) {
        hasLoad(false);
        fetchMessages();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);
  useEffect(() => {
    socket.on("newJoinRequest", (data) => {
      toast({
        title: "New Join Request",
        description: data.message,
        status: "info",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    });
  
    // Cleanup when the component unmounts
    return () => {
      socket.off("newJoinRequest");
    };
  }, []);
  useEffect(() => {
    // Listen for the "joinRequest" event from the server
    socket.on("joinRequest", (message) => {
      // Display the notification using Chakra UI's toast
      toast({
        title: "New Group Join Request",
        description: message, // This will be "User requested to join the group"
        status: "info",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    });

    // Cleanup event listener when the component unmounts
    return () => {
      socket.off("joinRequest");
    };
  }, [toast]);
  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageReceived.chat._id) {
        if (!notification.includes(newMessageReceived)) {
          setNotification([newMessageReceived, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageReceived]);
      }
    });

    socket.on("message unsent", ({ messageId, chatId }) => {
      if (selectedChat && selectedChat._id === chatId) {
        hasLoad(false);
        fetchMessages();
      }
    });

    return () => {
      socket.off("message received");
      socket.off("message unsent");
    };
  }, [selectedChat, messages, notification, fetchAgain]);

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing", { room: selectedChat._id, username: user.data.name });
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
        setIsTyping(false);
      }
    }, timerLength);
  };



  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const isDocument = !isImage && !isVideo;

    console.log("File Type:", file.type);
    console.log("isImage:", isImage);
    console.log("isVideo:", isVideo);
    console.log("isDocument:", isDocument);

    const formData = new FormData();
    const filename = file.name;
    formData.append("file", file);
    formData.append("name", filename);
    formData.append("isImage", isImage);
    formData.append("isVideo", isVideo);
    formData.append("isDocument", isDocument);

    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post("/api/upload", formData, config);

      console.log("Upload Response:", data);

      const fileUrl = `http://localhost:4500/images/${filename}`;

      const fileMessage = {
        content: fileUrl,
        chatId: selectedChat,
        isImage,
        isVideo,
        isDocument,
      };

      console.log("File Message:", fileMessage);

      const messageResponse = await axios.post("/message/send", fileMessage, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });

      console.log("Message Response:", messageResponse.data);

      socket.emit("new message", messageResponse.data);
      setMessages([...messages, messageResponse.data]);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error Occurred!",
        description: "Failed to upload the file",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };


  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            d="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              d={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {messages &&
              (!selectedChat.isGroupChat ? (
                <>
                  {getSender(user, selectedChat.users)}
                  <ProfileModal user={getSenderFull(user, selectedChat.users)} />
                </>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </>
              ))}
          </Text>
          <Box
            d="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} socket={socket} fetchMessages={fetchMessages} selectedChat={selectedChat} />
              </div>
            )}
            <FormControl
              onKeyDown={sendMessage}
              isRequired
              mt={3}
            >
              {istyping && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
                  <span style={{ marginRight: 10 }}>{username} is typing...</span>
                  <Lottie
                    options={defaultOptions}
                    width={70}
                    style={{ marginLeft: 0 }}
                  />
                </div>
              )}
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a message.."
                value={newMessage}
                onChange={typingHandler}
              />
              <Input
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                onChange={handleImageUpload}
                mt={3}
              />

            </FormControl>
          </Box>
        </>
      ) : (
        <Box d="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a chat to start messaging
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
