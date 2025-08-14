import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Snackbar, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const showSnackbar = (message) => {
    setSnackbar({ visible: true, message });
  };

  const renderMainContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return <Text style={styles.contentText}>📊 Dashboard</Text>;
      case 'products':
        return <Text style={styles.contentText}>📦 Liste des produits</Text>;
      default:
        return <Text style={styles.contentText}>Bienvenue</Text>;
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <View style={styles.container}>
          {/* Sidebar */}
          <View style={styles.sidebar}>
            <TouchableOpacity onPress={() => setSelectedMenu('dashboard')}>
              <Text style={styles.menuItem}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedMenu('products')}>
              <Text style={styles.menuItem}>Produits</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => showSnackbar('Déconnexion')}>
              <Text style={styles.menuItem}>Déconnexion</Text>
            </TouchableOpacity>
          </View>

          {/* Main content */}
          <View style={styles.main}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerText}>Stock Management App</Text>
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.content}>
              {renderMainContent()}
            </ScrollView>
          </View>

          {/* Snackbar */}
          <Snackbar
            visible={snackbar.visible}
            onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
            duration={2000}
          >
            {snackbar.message}
          </Snackbar>
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row', // Sidebar + main horizontal
  },
  sidebar: {
    width: 200,
    backgroundColor: '#2c3e50',
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  menuItem: {
    color: '#fff',
    paddingVertical: 15,
    fontSize: 16,
  },
  main: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    height: 60,
    backgroundColor: '#34495e',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
  },
  content: {
    padding: 20,
  },
  contentText: {
    fontSize: 16,
  },
});
