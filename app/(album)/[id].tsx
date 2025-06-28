import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import Track from '@/components/Track'; // Import the Track component

export default function AlbumScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbum = async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`https://api.spotify.com/v1/albums/${id}?market=NG`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAlbum(data);
      }
      setLoading(false);
    };
    if (id) fetchAlbum();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.green} />
      </View>
    );
  }

  if (!album) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: Colors.white }}>Album not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
       <Ionicons name="arrow-back" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Album Header */}
      <View style={styles.header}>
        <Image source={{ uri: album.images?.[0]?.url }} style={styles.cover} />
        <Text style={styles.albumName}>{album.name}</Text>
        <Text style={styles.artistNames}>
          {album.artists.map((a: any) => a.name).join(', ')}
        </Text>
        <Text style={styles.meta}>
          {album.release_date} ({album.release_date_precision}) • {album.total_tracks} tracks
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL(album.external_urls.spotify)}>
          <Text style={styles.spotifyLink}>Open in Spotify</Text>
        </TouchableOpacity>
      </View>

      {/* Tracks */}
      <View style={styles.tracksSection}>
        <Text style={styles.tracksHeader}>Tracks</Text>
        {album.tracks.items.map((track: any, idx: number) => (
          <Track key={track.id} track={track} showOptions={true} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 60,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 20,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    marginBottom: 20,
  },
  cover: {
    width: 220,
    height: 220,
    borderRadius: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  albumName: {
    color: Colors.white,
    fontSize: 24,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginBottom: 6,
  },
  artistNames: {
    color: Colors.lightGray,
    fontSize: 15,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginBottom: 4,
  },
  meta: {
    color: Colors.green,
    fontSize: 13,
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
  tracksSection: {
    paddingHorizontal: 16,
  },
  tracksHeader: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: Fonts.bold,
    marginBottom: 14,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.darkGray,
    gap: 10,
  },
  trackIndex: {
    color: Colors.lightGray,
    width: 24,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: Fonts.bold,
  },
  trackName: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  trackArtists: {
    color: Colors.lightGray,
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  trackDuration: {
    color: Colors.lightGray,
    fontSize: 13,
    fontFamily: Fonts.regular,
    width: 48,
    textAlign: 'right',
  },
});
