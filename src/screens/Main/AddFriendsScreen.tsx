import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Image,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Header from "../../components/Header";
import { useAppDispatch, useAppSelector } from "../../store";
import Loader from "../../utils/helpers/Loader";
import { getSearchedUserRequest } from "../../store/slice/user.slice";
import { normalize } from "../../utils/orientation";
import { chatCreateRequest } from "../../store/slice/chat.slice";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { show } from "../../components/Toast";

export default function AddFriendsScreen({navigation}:any) {
  const dispatch = useAppDispatch();
  const {userId} = useAppSelector(state=> state.auth)
  const { loading, searchedUserResponse, profileDetailsResponse } = useAppSelector(state => state.user);
  const {status, chatCreateResponse} = useAppSelector(state => state.chat);

  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  const onSearch = (text: string) => {
    setSearch(text);
    dispatch(getSearchedUserRequest({ query: text }));
  };

  useEffect(()=>{
    if(status){
      switch(status){
        case 'chat/chatCreateSuccess':{
          console.log("chatCreateResponse===>",chatCreateResponse.conversation._id, selectedUsers)
          
          if (selectedUsers.length > 1) {
            // Group chat - navigate to chat with group info
            navigation.navigate("Chat", { 
              chatId: chatCreateResponse.conversation._id, 
              chatUser: null,
              isGroupChat: true,
              groupName: groupName
            })
          } else {
            // 1-on-1 chat
            let chatUser = chatCreateResponse.conversation.participants.filter((itm:{_id: string}) => itm._id !== userId)[0]
            navigation.navigate("Chat", { chatId: chatCreateResponse.conversation._id, chatUser: chatUser })
          }
          setSelectedUsers([]);
          setGroupName("");
          break; 
        }
        case 'chat/chatCreateFailure':{
          setSelectedUsers([]);
          setGroupName("");
          break;
        }
        default:
          break;
      }
    }
  },[status])

  const renderItem = ({ item }: any) => {
    const hasAvatar = item.avatar && item.avatar.length > 0;
    const isSelected = selectedUsers.includes(item._id);

    const toggleSelection = () => {
      if (isSelected) {
        setSelectedUsers(selectedUsers.filter(id => id !== item._id));
      } else {
        setSelectedUsers([...selectedUsers, item._id]);
      }
    };

    console.log("selectedUsers",selectedUsers)

    return (
      <Pressable style={[styles.card, isSelected && styles.cardSelected]} onPress={toggleSelection}>
        {/* Avatar */}
        {hasAvatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <FontAwesome6 name="user" size={18} color="#fff" />
          </View>
        )}

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>

        {/* Checkbox */}
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <FontAwesome6 name="circle-check" size={14} color="#fff" />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={["#6A11CB", "#2575FC"]} style={{ flex: 1 }}>
        <Header showBack title={selectedUsers.length > 0 ? `Create Group (${selectedUsers.length})` : "Add Friends"} />

        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search by name or email"
            value={search}
            onChangeText={onSearch}
            style={styles.input}
            placeholderTextColor="#888"
          />
        </View>

        <Loader visible={loading} />

        <FlatList
          data={searchedUserResponse}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={renderItem}
          ListEmptyComponent={
            !loading && (
              <View style={styles.empty}>
                <FontAwesome6 name="user" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            )
          }
        />

        {/* Create Chat Button */}
        {selectedUsers.length > 0 && (
          <View style={styles.buttonContainer}>
            {selectedUsers.length > 1 && (
              <>
                <Text style={styles.groupNameLabel}>Group Name (Optional)</Text>
                <TextInput
                  placeholder="Enter group name"
                  value={groupName}
                  onChangeText={setGroupName}
                  style={styles.groupNameInput}
                  placeholderTextColor="#999"
                />
              </>
            )}
            <TouchableOpacity 
              style={styles.createBtn}
              onPress={() => {
                if (selectedUsers.length > 1 && !groupName.trim()) {
                  show("Please enter a group name");
                  return;
                }
                const participants = [...selectedUsers, userId];
                dispatch(chatCreateRequest({ 
                  participants, 
                  isGroup: selectedUsers?.length > 1 ? true: false,
                  groupName: groupName.trim() || undefined
                }));
              }}
            >
              <Text style={styles.createBtnText}>
                {selectedUsers.length === 1 ? "Start Chat" : `Create Group (${selectedUsers.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    backgroundColor: "#fff",
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 46,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    color: "#111",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 3,
  },
  cardSelected: {
    backgroundColor: "#F0ECFF",
    borderWidth: 2,
    borderColor: "#6A11CB",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: "#6A11CB",
    borderColor: "#6A11CB",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#6A11CB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  email: {
    fontSize: 13,
    color: "#777",
  },
  empty: {
    marginTop: 120,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
  },
  buttonContainer: {
    padding: normalize(16),
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  groupNameLabel: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#666",
    marginBottom: normalize(8),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: normalize(8),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(10),
    fontSize: normalize(14),
    color: "#111",
    marginBottom: normalize(12),
    backgroundColor: "#fafafa",
  },
  createBtn: {
    backgroundColor: "#6A11CB",
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnText: {
    color: "#fff",
    fontSize: normalize(16),
    fontWeight: "600",
  },
});
