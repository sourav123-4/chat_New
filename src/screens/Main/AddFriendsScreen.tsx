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
  KeyboardAvoidingView,
  Platform,
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
import { Fonts } from "../../themes";

export default function AddFriendsScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { userId } = useAppSelector(state => state.auth);
  const { loading, searchedUserResponse } = useAppSelector(state => state.user);
  const { status, chatCreateResponse } = useAppSelector(state => state.chat);

  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  const onSearch = (text: string) => {
    setSearch(text);
    dispatch(getSearchedUserRequest({ query: text }));
  };

  useEffect(() => {
    if (status === "chat/chatCreateSuccess") {
      if (selectedUsers.length > 1) {
        navigation.navigate("Chat", {
          chatId: chatCreateResponse.conversation._id,
          isGroupChat: true,
          groupName,
        });
      } else {
        const chatUser =
          chatCreateResponse.conversation.participants.find(
            (itm: any) => itm._id !== userId
          );
        navigation.navigate("Chat", {
          chatId: chatCreateResponse.conversation._id,
          chatUser,
        });
      }
      setSelectedUsers([]);
      setGroupName("");
    }
  }, [status]);

  const renderItem = ({ item }: any) => {
    const isSelected = selectedUsers.includes(item._id);

    const toggleSelection = () => {
      setSelectedUsers(prev =>
        isSelected ? prev.filter(id => id !== item._id) : [...prev, item._id]
      );
    };

    return (
      <Pressable
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={toggleSelection}
      >
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <FontAwesome6 name="user" size={normalize(18)} color="#fff" />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>

        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <FontAwesome6
              name="circle-check"
              size={normalize(14)}
              color="#fff"
            />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={["#6A11CB", "#2575FC"]} style={{ flex: 1 }}>
        <Header
          showBack
          title={
            selectedUsers.length > 1
              ? `Create Group (${selectedUsers.length})`
              : "Add Friends"
          }
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={normalize(20)}
        >
          {/* Search */}
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

          {/* User List */}
          <FlatList
            data={searchedUserResponse}
            keyExtractor={item => item._id}
            contentContainerStyle={{ padding: normalize(16), paddingBottom: normalize(120) }}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              !loading ? (
                <View style={styles.empty}>
                  <FontAwesome6 name="user" size={normalize(48)} color="#ccc" />
                  <Text style={styles.emptyText}>No users found</Text>
                </View>
              ) : null
            }
          />

          {/* Bottom Action Bar */}
          {selectedUsers.length > 0 && (
            <View style={styles.buttonContainer}>
              {selectedUsers.length > 1 && (
                <>
                  <Text style={styles.groupNameLabel}>Group Name</Text>
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
                  dispatch(
                    chatCreateRequest({
                      participants: [...selectedUsers, userId],
                      isGroup: selectedUsers.length > 1,
                      groupName: groupName.trim() || undefined,
                    })
                  );
                }}
              >
                <Text style={styles.createBtnText}>
                  {selectedUsers.length === 1
                    ? "Start Chat"
                    : `Create Group (${selectedUsers.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    backgroundColor: "#fff",
    marginHorizontal: normalize(16),
    marginTop: normalize(16),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(12),
    height: normalize(46),
    justifyContent: "center",
  },
  input: {
    fontSize: normalize(15),
    fontFamily: Fonts.Inter_Regular,
    color: "#111",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: normalize(14),
    borderRadius: normalize(14),
    marginBottom: normalize(12),
    elevation: 3,
  },
  cardSelected: {
    backgroundColor: "#F0ECFF",
    borderWidth: normalize(2),
    borderColor: "#6A11CB",
  },
  checkbox: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
    borderWidth: normalize(2),
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: normalize(12),
  },
  checkboxSelected: {
    backgroundColor: "#6A11CB",
    borderColor: "#6A11CB",
  },
  avatar: {
    width: normalize(42),
    height: normalize(42),
    borderRadius: normalize(21),
    backgroundColor: "#6A11CB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(12),
  },
  avatarImg: {
    width: normalize(42),
    height: normalize(42),
    borderRadius: normalize(21),
    marginRight: normalize(12),
  },
  name: {
    fontSize: normalize(16),
    fontFamily: Fonts.Inter_SemiBold,
  },
  email: {
    fontSize: normalize(13),
    fontFamily: Fonts.Inter_Regular,
    color: "#777",
  },
  empty: {
    marginTop: normalize(120),
    alignItems: "center",
    gap: normalize(12),
  },
  emptyText: {
    fontSize: normalize(16),
    fontFamily: Fonts.Inter_Regular,
    color: "#777",
  },
  buttonContainer: {
    padding: normalize(16),
    backgroundColor: "#fff",
    borderTopWidth: normalize(1),
    borderTopColor: "#E5E7EB",
  },
  groupNameLabel: {
    fontSize: normalize(12),
    fontFamily: Fonts.Inter_SemiBold,
    color: "#666",
    marginBottom: normalize(8),
    textTransform: "uppercase",
    letterSpacing: normalize(0.5),
  },
  groupNameInput: {
    borderWidth: normalize(1),
    borderColor: "#E5E7EB",
    borderRadius: normalize(8),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(10),
    fontSize: normalize(14),
    fontFamily: Fonts.Inter_Regular,
    color: "#111",
    marginBottom: normalize(12),
    backgroundColor: "#fafafa",
  },
  createBtn: {
    backgroundColor: "#6A11CB",
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: "center",
  },
  createBtnText: {
    color: "#fff",
    fontSize: normalize(16),
    fontFamily: Fonts.Inter_SemiBold,
  },
});
