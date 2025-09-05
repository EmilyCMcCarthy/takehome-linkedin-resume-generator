"use client";
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { ProfileData } from '../utils/types';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 30,
        fontFamily: 'Helvetica'
    },
    header: {
        marginBottom: 10,
        borderBottom: '1pt solid #000000',
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 10,
        paddingRight: 10,
        width: '100%'
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#2d64bc'
    },
    section: {
        marginTop: 20,
        marginBottom: 15
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#2d64bc',
        borderBottom: '0.5pt solid #cccccc',
        paddingBottom: 3
    },
    item: {
        marginBottom: 10,
        paddingLeft: 5
    },
    itemText: {
        fontSize: 12,
        marginBottom: 3,
        color: '#333333'
    },
    noData: {
        fontSize: 12,
        color: '#999999',
        fontStyle: 'italic'
    }
});


interface PDFDocLinkedInProps {
    profileData: ProfileData;
}


export const PDFDocLinkedIn = ({
    profileData,
}: PDFDocLinkedInProps) => {

    // Helper to get clean array data
    const getCleanData = (data: any) => {
        if (!data) return [];
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
            return data[0] || [];
        }
        return Array.isArray(data) ? data : [];
    };

    const experienceData = getCleanData(profileData?.experience);
    const educationData = getCleanData(profileData?.education);

    return (
        <Document>
            <Page wrap style={styles.page}>
                {/* Header - Fixed at top */}
                <View fixed style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {/* Profile Image */}
                        {profileData?.general?.profilePicture && (
                            <Image
                                alt="profile-picture"
                                src={profileData.general.profilePicture}
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 25,
                                    marginRight: 15
                                }}
                            />
                        )}

                        {/* Name and other info */}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>
                                {profileData?.general?.name || 'LinkedIn Profile'}
                            </Text>

                            {profileData?.general?.mainSectionMediumText && (
                                profileData.general.mainSectionMediumText.map((textStr, index) => (
                                    <Text key={`text-medium-${index}`} style={{ fontSize: 14, color: '#666666', marginTop: 3 }}>
                                        {textStr}
                                    </Text>
                                ))
                            )}
                        </View>
                    </View>
                </View>
                {/* Main Content */}
                <View>
                    {/* Experience Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Experience</Text>

                        {experienceData && experienceData.length > 0 ? (
                            experienceData.map((experience, index) => (
                                <View key={`exp-${index}`} style={styles.item} wrap={false}>
                                    {Array.isArray(experience) ? (
                                        experience.map((detail, detailIndex) => (
                                            <Text key={`exp-detail-${detailIndex}`} style={styles.itemText}>
                                                {detail}
                                            </Text>
                                        ))
                                    ) : (
                                        <Text style={styles.itemText}>{experience}</Text>
                                    )}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noData}>No experience data available</Text>
                        )}
                    </View>

                    {/* Education Section */}
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.sectionTitle}>Education</Text>

                        {educationData && educationData.length > 0 ? (
                            educationData.map((education, index) => (
                                <View key={`edu-${index}`} style={styles.item} wrap={false}>
                                    {Array.isArray(education) ? (
                                        education.map((detail, detailIndex) => (
                                            <Text key={`edu-detail-${detailIndex}`} style={styles.itemText}>
                                                {detail}
                                            </Text>
                                        ))
                                    ) : (
                                        <Text style={styles.itemText}>{education}</Text>
                                    )}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noData}>No education data available</Text>
                        )}
                    </View>
                </View>
            </Page>
        </Document>
    );
};


