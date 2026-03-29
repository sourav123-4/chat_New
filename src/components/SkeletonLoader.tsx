import { View } from "react-native";
import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import { normalize } from "../utils/orientation";

export const HomeSkeletonLoader = () => {
  return (
    <SkeletonPlaceholder borderRadius={10}>
      {[...Array(10)].map((_, index) => (
        <View
          key={index}
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderColor: "#E5E7EB",
            borderWidth: 1,
            padding: normalize(12),
            borderRadius: normalize(15),
            margin: normalize(10),
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: normalize(50),
              height: normalize(50),
              borderRadius: normalize(25),
            }}
          />

          {/* Content */}
          <View style={{ flex: 1, marginLeft: normalize(12) }}>
            
            {/* Top Row (Name + Time) */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* Name */}
              <View
                style={{
                  width: normalize(140),
                  height: normalize(15),
                  borderRadius: normalize(4),
                }}
              />

              {/* Time (RIGHT TOP ✅) */}
              <View
                style={{
                  width: normalize(50),
                  height: normalize(12),
                  borderRadius: normalize(4),
                }}
              />
            </View>

            {/* Message */}
            <View
              style={{
                marginTop: normalize(8),
                width: normalize(200),
                height: normalize(12),
                borderRadius: normalize(4),
              }}
            />
          </View>
        </View>
      ))}
    </SkeletonPlaceholder>
  );
};


export const ChatSkeletonLoader = () => {
  const rows = [
    { isMe: false, width: normalize(160) },
    { isMe: true,  width: normalize(120) },
    { isMe: false, width: normalize(200) },
    { isMe: true,  width: normalize(90)  },
    { isMe: false, width: normalize(140) },
    { isMe: true,  width: normalize(180) },
    { isMe: false, width: normalize(110) },
    { isMe: true,  width: normalize(150) },
  ];

  return (
    <SkeletonPlaceholder borderRadius={12}>
      <View style={{ padding: normalize(12) }}>
        {rows.map((row, index) => (
          <View
            key={index}
            style={{
              alignItems: row.isMe ? 'flex-end' : 'flex-start',
              marginVertical: normalize(6),
            }}
          >
            <View
              style={{
                width: row.width,
                height: normalize(38),
                borderRadius: normalize(12),
              }}
            />
            <View
              style={{
                width: normalize(40),
                height: normalize(8),
                borderRadius: normalize(4),
                marginTop: normalize(4),
              }}
            />
          </View>
        ))}
      </View>
    </SkeletonPlaceholder>
  );
};

export const ProfileSkeleton = () => {
  return (
    <SkeletonPlaceholder borderRadius={4}>
      <View style={{ paddingHorizontal: normalize(16), paddingTop: normalize(20), paddingBottom: normalize(40) }}>

        {/* AVATAR SECTION */}
        <View style={{ alignItems: "center", marginBottom: normalize(24) }}>
          <View
            style={{
              width: normalize(120),
              height: normalize(120),
              borderRadius: normalize(60),
              borderWidth: 3, // ✅ match real
            }}
          />
        </View>

        {/* CARD */}
        <View
          style={{
            borderRadius: normalize(15),
            padding: normalize(18),
            marginBottom: normalize(20),
            borderColor: "#E5E7EB",
            borderWidth: 1,

          }}
        >
          {/* ROW 1 */}
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            
            {/* ICON */}
            <View style={{ width: 16, height: 16, borderRadius: 4 }} />

            {/* CONTENT */}
            <View style={{ marginLeft: normalize(12), flex: 1 }}>
              {/* LABEL */}
              <View
                style={{
                  width: normalize(90),
                  height: normalize(10),
                  borderRadius: normalize(4),
                  marginBottom: normalize(15),
                }}
              />

              {/* VALUE */}
              <View
                style={{
                  width: "70%",
                  height: normalize(15),
                  borderRadius: 4,
                }}
              />
            </View>
          </View>

          {/* ROW 2 */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: normalize(14) }}>
            <View style={{ width: 16, height: 16, borderRadius: 4 }} />
            <View style={{ marginLeft: normalize(12), flex: 1 }}>
              <View style={{ width: normalize(110), height: normalize(10), borderRadius: 4, marginBottom: normalize(4) }} />
              <View style={{ width: "80%", height: normalize(15), borderRadius: 4 }} />
            </View>
          </View>

          {/* ROW 3 */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: normalize(14) }}>
            <View style={{ width: 16, height: 16, borderRadius: 4 }} />
            <View style={{ marginLeft: normalize(12), flex: 1 }}>
              <View style={{ width: normalize(100), height: normalize(10), borderRadius: 4, marginBottom: normalize(4) }} />
              <View style={{ width: "60%", height: normalize(15), borderRadius: 4 }} />
            </View>
          </View>
        </View>

        {/* BUTTONS */}
        <View style={{ marginTop: normalize(12) }}>
          
          {/* Edit Button */}
          <View
            style={{
              height: normalize(45),
              borderRadius: normalize(8),
              marginBottom: normalize(12),
            }}
          />

          {/* Change Password */}
          <View
            style={{
              height: normalize(45),
              borderRadius: normalize(8),
              marginBottom: normalize(12),
            }}
          />

          {/* Logout */}
          <View
            style={{
              height: normalize(45),
              borderRadius: normalize(8),
            }}
          />
        </View>

      </View>
    </SkeletonPlaceholder>
  );
};