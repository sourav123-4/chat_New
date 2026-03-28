import React from "react";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Colors } from "../../themes";
import { normalize } from "../../utils/orientation";


export default function ScreenA() {

    return (
        <View style={styles.container}>
            <View style={styles.subContainer}>
                <Text style={styles.fabText}>Screen A Screen A Screen A Screen A</Text>
            </View>
            <View style={styles.subContainer}>
                <Text style={styles.fabText}>Screen B Screen B Screen B Screen B</Text>
            </View>
            <View style={styles.subContainer}>
                <Text style={styles.fabText}>Screen C Screen C Screen C Screen C</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: normalize(20),
        padding: normalize(20),
        flexDirection: "row",
        flexWrap: 'wrap'
    },
    subContainer: {
        backgroundColor: Colors.teal_blue,
        width: normalize(100),
        height: normalize(100),
        borderRadius: normalize(10),
        padding: normalize(10),
        alignItems: "center",
        justifyContent: "center",
    },
    fabText: { fontSize: normalize(16), color: "#fff", fontFamily: "DMSans-SemiBold", flexWrap: 'wrap' },
});
