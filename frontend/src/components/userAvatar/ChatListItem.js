import { Avatar } from "@chakra-ui/avatar";
import { Box, Text } from "@chakra-ui/layout";
import { ChatState } from "../../Context/ChatProvider";
import {useState} from "react"
import { Button } from "@chakra-ui/react";
const ChatListItem = ({ user,handleFunction }) => {

  return (
    <Box
      onClick={handleFunction}
      cursor="pointer"
      bg="#E8E8E8"
      _hover={{
        background: "#38B2AC",
        color: "white",
      }}
      w="100%"
      d="flex"
      alignItems="center"
      color="black"
      px={3}
      py={2}
      mb={2}
      borderRadius="lg"
    >
      <Avatar
        mr={2}
        size="sm"
        cursor="pointer"
        name={user.name}
        src={user.profilePhoto}
      />
      <Box>
        <Text>{user.name}</Text>
        <Text fontSize="xs">
          <b>Username : </b>
          {user.username}
        </Text>
      </Box>
      <Box>
      {/* <Button colorScheme={add.filter(f=>f.id==user._id).length>0?"green":"blue"} onClick={()=> handleAdd(user._id)}>Add</Button> */}
      </Box>
    </Box>
  );
};

export default ChatListItem;
