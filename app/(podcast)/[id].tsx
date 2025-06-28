import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import Track from '@/components/Track';

export default function PodcastScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [podcast, setPodcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPodcast = async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`https://api.spotify.com/v1/shows/${id}?market=ES`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPodcast(data);
      }
      setLoading(false);
    };
    if (id) fetchPodcast();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.green} />
      </View>
    );
  }

  if (!podcast) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: Colors.white }}>Podcast not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={Colors.white} />
      </TouchableOpacity>
      <View style={styles.header}>
        <Image source={{ uri: podcast.images?.[0]?.url }} style={styles.cover} />
        <Text style={styles.podcastName}>{podcast.name}</Text>
        <Text style={styles.publisher}>{podcast.publisher}</Text>
        <Text style={styles.description}>{podcast.description}</Text>
        <TouchableOpacity onPress={() => Linking.openURL(podcast.external_urls.spotify)}>
          <Text style={styles.spotifyLink}>Open in Spotify</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.episodesSection}>
        <Text style={styles.episodesHeader}>Episodes</Text>
        {podcast.episodes?.items?.map((ep: any) => (
          <Track
            key={ep.id}
            track={{
              ...ep,
              album: { images: ep.images }, // For compatibility with Track component
              artists: ep.artists || [{ name: podcast.publisher }],
            }}
            showOptions={true}
            onPress={() => Linking.openURL(ep.external_urls.spotify)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  backButton: {
    marginTop: 40,
    marginLeft: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  cover: {
    width: 180,
    height: 180,
    borderRadius: 10,
    marginBottom: 18,
  },
  podcastName: {
    color: Colors.white,
    fontSize: 22,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginBottom: 6,
  },
  publisher: {
    color: Colors.green,
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: Colors.lightGray,
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginBottom: 10,
    textAlign: 'center',
  },
  spotifyLink: {
    color: Colors.green,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginTop: 8,
    marginBottom: 10,
    textAlign: 'center',
  },
  episodesSection: {
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  episodesHeader: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginBottom: 10,
    marginLeft: 20,
  },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.darkGray,
  },
  episodeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  episodeName: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  episodeDate: {
    color: Colors.lightGray,
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
});