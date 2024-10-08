import { Avatar } from "@chakra-ui/avatar";
import { Box, Text } from "@chakra-ui/layout";
import { ChatState } from "../../Context/ChatProvider";

const UserListItem = ({ groupInfo,handleFunction }) => {
  const { user } = ChatState();
  console.log(user)

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
        name={groupInfo.chatName}
        src={user.pic}
      />
      <Box>
        <Text>{groupInfo.chatName}</Text>
        <Text fontSize="xs">
          <b>Members : </b>
          {groupInfo.users.length}
        </Text>
      </Box>
    </Box>
  );
};

export default UserListItem;
