import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Linking from 'expo-linking';
import Track from "@/components/Track";
type ContentType = 'all' | 'music' | 'podcasts';

export default function SpotifyHomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const navigation = useNavigation();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [recentTracks, setRecentTracks] = useState<any[]>([]);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ContentType>('all');
  const [loading, setLoading] = useState({
    music: true,
    podcasts: true,
    newReleases: true,
  });
  const [artistAlbums, setArtistAlbums] = useState<any[]>([]);
  const [loadingArtistAlbums, setLoadingArtistAlbums] = useState(true);

  const filterOptions = [
    { id: 'all', name: 'All' },
    { id: 'music', name: 'Music' },
    { id: 'podcasts', name: 'Podcasts' },
  ];

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchRecentlyPlayed = async () => {
    try {
      setLoading(prev => ({ ...prev, music: true }));
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        'https://api.spotify.com/v1/me/player/recently-played?limit=50',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const seen = new Set();
        const uniqueTracks = data.items.filter((item: any) => {
          const id = item.track.id;
          if (seen.has(id)) return false; 
          seen.add(id);
          return true;
        });

        setRecentTracks(uniqueTracks);
      }
    } catch (error) {
      console.error('Error fetching recently played tracks:', error);
    } finally {
      setLoading(prev => ({ ...prev, music: false }));
    }
  };

  // Fetch albums for the top artist
  const fetchArtistAlbums = async (artistId: string) => {
    try {
      setLoadingArtistAlbums(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,compilation&market=ES&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setArtistAlbums(data.items || []);
      } else {
        const text = await response.text();
        console.error('Artist albums fetch failed:', response.status, text);
      }
    } catch (error) {
      console.error('Error fetching artist albums:', error);
    } finally {
      setLoadingArtistAlbums(false);
    }
  };

  const fetchTopArtists = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const topArtistsResponse = await fetch(
        'https://api.spotify.com/v1/me/top/artists?limit=6',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (topArtistsResponse.ok) {
        const topArtistsData = await topArtistsResponse.json();
        const artistIds = topArtistsData.items.map((artist: any) => artist.id).join(',');

        const detailedArtistsResponse = await fetch(
          `https://api.spotify.com/v1/artists?ids=${artistIds}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (detailedArtistsResponse.ok) {
          const detailedArtistsData = await detailedArtistsResponse.json();
          setTopArtists(detailedArtistsData.artists);

          // Fetch albums for the first top artist
          if (detailedArtistsData.artists.length > 0) {
            fetchArtistAlbums(detailedArtistsData.artists[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching top artists:', error);
    }
  };

  const fetchPodcasts = async () => {
    try {
      setLoading(prev => ({ ...prev, podcasts: true }));
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const podcastIds = [
        '5CfCWKI5pZ28U0uOzXkDHe',
        '5as3aKmN2k11yfDDDSrvaZ',
        '2MAi0BvDc6GTFvKFPXnkCL',
        '6z4NLXyHPga1UmSJsPK7G1',
        '3Ev8RQxj2Fvga5j6mXwQ9M',
        '7d7fQW4JzRf2k4rBtALjvl'
      ];

      const response = await fetch(
        `https://api.spotify.com/v1/shows?ids=${podcastIds.join(',')}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPodcasts(data.shows.filter((show: any) => show !== null));
      }
    } catch (error) {
      console.error('Error fetching podcasts:', error);
    } finally {
      setLoading(prev => ({ ...prev, podcasts: false }));
    }
  };

  const fetchNewReleases = async () => {
    try {
      setLoading(prev => ({ ...prev, newReleases: true }));
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        'https://api.spotify.com/v1/browse/new-releases?limit=10',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNewReleases(data.albums.items || []);
        //console.log('New releases fetched:', data.albums.items);
      } else {
        const text = await response.text();
        console.error('New releases fetch failed:', response.status, text);
      }
    } catch (error) {
      console.error('Error fetching new releases:', error);
    } finally {
      setLoading(prev => ({ ...prev, newReleases: false }));
    }
  };

  const handleFilterPress = (filter: ContentType) => {
    setActiveFilter(filter);
    if (filter === 'podcasts' && podcasts.length === 0) {
      fetchPodcasts();
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchRecentlyPlayed();
    fetchTopArtists();
    fetchPodcasts();
    fetchNewReleases();
  }, []);

  const renderMusicContent = () => (
    <>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Top Artists</Text>
        {loading.music ? (
          <ActivityIndicator size="small" color={Colors.green} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {topArtists.map((artist, index) => (
              <TouchableOpacity
                key={index}
                style={styles.artistCard}
                onPress={() => router.push({ pathname: '/(artist)/[id]', params: { id: artist.id } })}
              >
                <Image
                  source={{ uri: artist.images?.[0]?.url }}
                  style={styles.artistImage}
                />
                <Text style={styles.artistName} numberOfLines={1}>
                  {artist.name}
                </Text>
                {artist.genres?.length > 0 && (
                  <Text style={styles.artistGenre} numberOfLines={1}>
                    {artist.genres[0]}
                  </Text>
                )}
                <Text style={styles.artistPopularity}>
                  {artist.popularity}% popularity
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.recentlyPlayedHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recently Played
          </Text>
          {recentTracks.length > 3 && (
            <TouchableOpacity onPress={() => setShowModal(true)}>
              <Text style={styles.seeMoreText}>See More</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading.music ? (
          <ActivityIndicator size="small" color={Colors.green} />
        ) : (
          recentTracks.slice(0, 3).map((item, index) => (
            <Track
              key={item.track.id}
              track={item.track}
              showOptions={true}
              
            />
          ))
        )}
      </View>
    </>
  );

  const renderPodcastContent = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Popular Podcasts</Text>
      {loading.podcasts ? (
        <ActivityIndicator size="large" color={Colors.green} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {podcasts.map((podcast, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.podcastCard}
              onPress={() =>router.push({ pathname: '/(podcast)/[id]', params: { id: podcast.id } })}
            >
              <Image
                source={{ uri: podcast.images?.[0]?.url }}
                style={styles.podcastImage}
              />
              <Text style={styles.podcastName} numberOfLines={1}>
                {podcast.name}
              </Text>
              <Text style={styles.podcastPublisher} numberOfLines={1}>
                {podcast.publisher}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderNewReleasesContent = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>New Releases</Text>
      {loading.newReleases ? (
        <ActivityIndicator size="large" color={Colors.green} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {newReleases.map((album, index) => (
            <TouchableOpacity
              key={album.id}
              style={styles.audiobookCard}
              onPress={() => router.push({ pathname: '/(album)/[id]', params: { id: album.id } })}
            >
              <Image
                source={{ uri: album.images?.[0]?.url }}
                style={styles.audiobookImage}
              />
              <Text style={styles.audiobookTitle} numberOfLines={1}>
                {album.name}
              </Text>
              <Text style={styles.audiobookAuthor} numberOfLines={1}>
                {album.artists?.map((a: any) => a.name).join(', ')}
              </Text>
              <Text style={styles.audiobookChapters}>
                {album.release_date}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  // Render Top Artist's Albums
  const renderArtistAlbums = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Artist's Albums</Text>
      {loadingArtistAlbums ? (
        <ActivityIndicator size="large" color={Colors.green} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {artistAlbums.map((album, idx) => (
            <TouchableOpacity
              key={album.id}
              style={styles.audiobookCard}
              onPress={() => router.push({ pathname: '/(album)/[id]', params: { id: album.id } })}
            >
              <Image
                source={{ uri: album.images?.[0]?.url }}
                style={styles.audiobookImage}
              />
              <Text style={styles.audiobookTitle} numberOfLines={1}>
                {album.name}
              </Text>
              <Text style={styles.audiobookAuthor} numberOfLines={1}>
                {album.artists?.map((a: any) => a.name).join(', ')}
              </Text>
              <Text style={styles.audiobookChapters}>
                {album.release_date} ({album.release_date_precision})
              </Text>
              <Text style={styles.audiobookChapters}>
                Type: {album.album_type} | Tracks: {album.total_tracks}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderContent = () => {
    switch (activeFilter) {
      case 'music':
        return (
          <>
            {renderMusicContent()}
            {renderArtistAlbums()}
            {renderNewReleasesContent()}
          </>
        );
      case 'podcasts':
        return (
          <>
            {renderPodcastContent()}
          </>
        );
      default:
        return (
          <>
            {renderMusicContent()}
            {renderArtistAlbums()}
            {renderPodcastContent()}
            {renderNewReleasesContent()}
          </>
        );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.filterWrapper, { backgroundColor: theme.background }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            <Pressable onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
              {userProfile?.images?.[0]?.url ? (
                <Image
                  source={{ uri: userProfile.images[0].url }}
                  style={styles.profileImage}
                />
              ) : (
                <Ionicons
                  name="person-circle"
                  size={60}
                  color={theme.text}
                  style={styles.profileImage}
                />
              )}
            </Pressable>

            {filterOptions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.filterButton,
                  activeFilter === item.id && styles.activeFilterButton,
                ]}
                onPress={() => handleFilterPress(item.id as ContentType)}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === item.id && styles.activeFilterText,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.container}>
          {renderContent()}
        </ScrollView>

        <Modal visible={showModal} animationType="slide">
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Recently Played
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons
                  name="close"
                  size={30}
                  color={Colors.green}
                  style={styles.modalClose}
                />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {recentTracks.map((item, index) => (
                <Track
                  key={item.track.id}
                  track={item.track}
                  showOptions={true}
                  
                />
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterWrapper: {
    paddingTop: StatusBar.currentHeight || 20,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  filterContent: {
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: Colors.darkGray,
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    height: 40,
    justifyContent: 'center',
  },
  activeFilterButton: {
    backgroundColor: Colors.green,
  },
  filterText: {
    color: Colors.white,
    fontFamily: Fonts.light,
  },
  activeFilterText: {
    color: Colors.black,
    fontFamily: Fonts.bold,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  section: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginBottom: 10,
  },
  artistCard: {
    width: 120,
    marginRight: 12,
    alignItems: 'center',
  },
  artistImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 6,
    backgroundColor: '#333',
  },
  artistName: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginTop: 4,
  },
  artistGenre: {
    color: Colors.lightGray,
    fontSize: 10,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 2,
  },
  artistPopularity: {
    color: Colors.green,
    fontSize: 10,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 2,
  },
  podcastCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: Colors.darkGray,
    borderRadius: 10,
    padding: 10,
  },
  podcastImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  podcastName: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  podcastPublisher: {
    color: Colors.lightGray,
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  audiobookCard: {
    width: 180,
    marginRight: 12,
    backgroundColor: Colors.darkGray,
    borderRadius: 10,
    padding: 10,
  },
  audiobookImage: {
    width: 160,
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  audiobookTitle: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  audiobookAuthor: {
    color: Colors.lightGray,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },
  audiobookChapters: {
    color: Colors.green,
    fontSize: 10,
    fontFamily: Fonts.regular,
  },
  trendingAlbum: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGray,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  albumImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  albumTitle: {
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  albumArtist: {
    color: Colors.lightGray,
  },
  recentlyPlayedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  seeMoreText: {
    color: Colors.green,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  modalClose: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
});