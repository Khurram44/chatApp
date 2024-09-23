import { useState } from "react";
import { Avatar, Tooltip, IconButton, Button, Box, Text } from "@chakra-ui/react";
import { FaThumbsUp, FaHeart, FaRegGrin, FaSurprise, FaSadTear, FaAngry } from 'react-icons/fa';
import axios from "axios";
import ScrollableFeed from "react-scrollable-feed";
import { isLastMessage, isSameSender, isSameSenderMargin, isSameUser } from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";
import { DeleteIcon } from "@chakra-ui/icons";

const ScrollableChat = ({ messages, socket, fetchMessages, selectedChat }) => {
  const { user } = ChatState();
  const [showReactions, setShowReactions] = useState(null);

  const deleteChatMessage = async (messageId) => {
    try {
      await axios.delete(`/message/unsend/${messageId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      socket.emit("message unsent", { messageId, chatId: selectedChat._id });
      fetchMessages();
    } catch (error) {
      console.error("Failed to delete the message", error.response.data);
    }
  };

  const handleReaction = async (messageId, reactionType) => {
    try {
      await axios.post(`/message/react`, { messageId, reactionType }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      socket.emit("reaction update", { messageId, reactionType, chatId: selectedChat._id });
      fetchMessages();
      setShowReactions(null);
    } catch (error) {
      console.error("Failed to update reaction", error.response.data);
    }
  };

  const getReactionCount = (message, reactionType) => {
    return message.reactions?.filter(r => r.type === reactionType).length || 0;
  };

  const reactionIcons = {
    like: <FaThumbsUp/>,
    love: <FaHeart />,
    haha: <FaRegGrin />,
    wow: <FaSurprise />,
    sad: <FaSadTear />,
    angry: <FaAngry />,
  };

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => (
          <div style={{ display: "flex", position: "relative", marginBottom: "10px" }} key={m._id}>
            {(isSameSender(messages, m, i, user.data._id) ||
              isLastMessage(messages, i, user.data._id)) && (
                <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
                  <Avatar
                    mt="7px"
                    mr={1}
                    size="sm"
                    cursor="pointer"
                    name={m.sender.name}
                    src={m.sender.pic}
                  />
                </Tooltip>
              )}
            {/* Message content handling */}
            {m.isImage ? (
              <img
                src={m.content}
                alt="message"
                style={{
                  maxWidth: "200px",
                  maxHeight: "200px",
                  borderRadius: "10px",
                  marginLeft: isSameSenderMargin(messages, m, i, user.data._id),
                  marginTop: isSameUser(messages, m, i, user.data._id) ? 3 : 10,
                }}
                onClick={() => setShowReactions(m._id === showReactions ? null : m._id)}
              />
            ) : m.isVideo ? (
              <video
                controls
                src={m.content}
                style={{
                  maxWidth: "200px",
                  maxHeight: "200px",
                  borderRadius: "10px",
                  marginLeft: isSameSenderMargin(messages, m, i, user.data._id),
                  marginTop: isSameUser(messages, m, i, user.data._id) ? 3 : 10,
                }}
                onClick={() => setShowReactions(m._id === showReactions ? null : m._id)}
              />
            ) : m.isDocument ? (
              <div
                style={{
                  maxWidth: "200px",
                  maxHeight: "200px",
                  borderRadius: "10px",
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px",
                  marginLeft: isSameSenderMargin(messages, m, i, user.data._id),
                  marginTop: isSameUser(messages, m, i, user.data._id) ? 3 : 10,
                }}
                onClick={() => setShowReactions(m._id === showReactions ? null : m._id)}
              >
                <a
                  href={m.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textAlign: "center", color: "black" }}
                >
                  {m.content.endsWith(".pdf") ? (
                    <img
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGAA4Wd4bco5Xv33GasXrnDdQT5OFXwa3HUQ&s"
                      alt="PDF file"
                      style={{ width: "100px", height: "100px" }}
                    />
                  ) : (
                    <img
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRs3nWc9jmdM7_WmDcEAy3PC2zMur7A1ee_bw&s"
                      alt="Document file"
                      style={{ width: "100px", height: "100px" }}
                    />
                  )}
                  <br />
                  {m.content.split('/').pop()}
                </a>
              </div>
            ) : (
              <span
                style={{
                  backgroundColor: `${m.sender._id === user.data._id ? "#BEE3F8" : "#B9F5D0"}`,
                  marginLeft: isSameSenderMargin(messages, m, i, user.data._id),
                  marginTop: isSameUser(messages, m, i, user.data._id) ? 3 : 10,
                  borderRadius: "20px",
                  padding: "5px 15px",
                  maxWidth: "75%",
                }}
                onClick={() => setShowReactions(m._id === showReactions ? null : m._id)}
              >
                {m.content}
              </span>
            )}
            {m.sender._id === user.data._id && !m.isDeleted && (
              <span>
                <IconButton onClick={() => deleteChatMessage(m._id)}>
                  <DeleteIcon />
                </IconButton>
              </span>
            )}
            {m._id === showReactions && (
              <Box
                position="absolute"
                bottom="-60px"
                left="0"
                bg="white"
                borderRadius="md"
                boxShadow="md"
                p="2"
                zIndex="1000"
                display="flex"
                flexDirection="row"
                justifyContent="space-around"
                width="100%"
              >
                {Object.keys(reactionIcons).map((reactionType) => (
                  <Button
                    key={reactionType}
                    variant="ghost"
                    leftIcon={reactionIcons[reactionType]}
                    onClick={() => handleReaction(m._id, reactionType)}
                    style={{cursor:'pointer'}}
                  >
                    <Text ml="2">{getReactionCount(m, reactionType)}</Text>
                  </Button>
                ))}
              </Box>
            )}
          </div>
        ))}
    </ScrollableFeed>
  );
};

export default ScrollableChat;
