import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg'; // Import Svg and Path for rendering SVG icons

// Main App component representing the introduction screen
const Screen = () => {
  const insets = useSafeAreaInsets();
  // Define the color palette based on user's request and complementary colors
  const colors = {
    primaryGreen: 'rgba(23, 190, 126, 1)', // Main green for accents
    darkGreen: 'rgba(6, 172, 108, 1)',    // Darker green for buttons/stronger elements
    white: '#FFFFFF',                     // Background and text
    lightGray: '#F0F4F8',                 // Subtle background for sections
    darkGray: '#4B5563',                  // Secondary text
    textBlack: '#1F2937',                 // Main text color
  };

  // Feature data to easily map and render
  const features = [
    {
      title: 'Map Your Farmland',
      description: 'Easily draw and register your farmland polygons on a satellite map view.',
      icon: (
        // Converted SVG to react-native-svg components
        <Svg width="32" height="32" viewBox="0 0 24 24" fill={colors.darkGreen}>
          <Path fillRule="evenodd" d="M11.54 22.351A2.793 2.793 0 0 0 12 22.5a2.793 2.793 0 0 0 .46-.149L21.75 16.5V8.25L12 2.25 2.25 8.25v8.25l9.29 5.851ZM12 7.5l6.75 4.5-6.75 4.5L5.25 12l6.75-4.5Z" clipRule="evenodd" />
        </Svg>
      ),
    },
    {
      title: 'Select Your Crops',
      description: 'Assign specific crops to your registered land plots for tailored insights.',
      icon: (
        // Converted SVG to react-native-svg components
        <Svg width="32" height="32" viewBox="0 0 24 24" fill={colors.darkGreen}>
          <Path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
        </Svg>
      ),
    },
    {
      title: 'Crop Information Hub',
      description: 'Access vital details about crops: growing seasons, pests, cultivars, and more.',
      icon: (
        // Converted SVG to react-native-svg components
        <Svg width="32" height="32" viewBox="0 0 24 24" fill={colors.darkGreen}>
          <Path d="M11.25 4.533A9.752 9.752 0 0 0 5.617 9.75H4.125c-.51 0-.9.44-.825.945A10.435 10.435 0 0 0 12 21.75a10.435 10.435 0 0 0 8.7-10.055c.075-.506-.315-.945-.825-.945h-1.492A9.752 9.752 0 0 0 12.75 4.533V2.25c0-.414-.336-.75-.75-.75S11.25 1.836 11.25 2.25v2.283ZM12 6a.75.75 0 0 1 .75.75v6.59l3.522 3.523a.75.75 0 1 1-1.06 1.06L11.25 13.06v-6.31c0-.414.336-.75.75-.75Z" />
        </Svg>
      ),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={[styles.container, {paddingTop: insets.top}]}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.textBlack }]}>
            Welcome to <Text style={{ color: colors.primaryGreen }}>AgriWise</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.darkGray }]}>
            Your intelligent companion for modern agriculture. Manage your farms,
            track your crops, and boost your yield with smart insights.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          {features.map((feature, index) => (
            <View
              key={index}
              style={[styles.featureCard, { backgroundColor: colors.lightGray }]}
            >
              <View
                style={[styles.iconContainer, { backgroundColor: colors.white }]}
              >
                {feature.icon}
              </View>
              <Text style={[styles.featureTitle, { color: colors.textBlack }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.darkGray }]}>
                {feature.description}
              </Text>
            </View>
          ))}
        </View>

        {/* Call to Action Button */}
        <TouchableOpacity
          style={[
            styles.callToActionButton,
            {
              backgroundColor: colors.darkGreen,
              shadowColor: colors.primaryGreen, // For iOS shadow
              elevation: 8, // For Android shadow
            },
          ]}
          activeOpacity={0.7} // Reduce opacity when pressed
          onPress={() => console.log('Get Started Pressed')} // Placeholder for navigation
        >
          <Text style={[styles.buttonText, { color: colors.white }]}>
            Get Started
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default Screen;

// StyleSheet for React Native components
const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Allows content to grow and scroll
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20, // Add vertical padding for overall content
    paddingHorizontal: 16, // Horizontal padding
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 10, // Add some horizontal padding to text
  },
  title: {
    fontSize: 32, // Adjusted for mobile
    fontWeight: '800', // Equivalent to font-extrabold
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 38, // Adjusted line height
  },
  subtitle: {
    fontSize: 18, // Adjusted for mobile
    textAlign: 'center',
    maxWidth: 600, // Max width for readability on larger screens (tablets)
  },
  featuresSection: {
    width: '100%',
    alignItems: 'center', // Center cards horizontally
    marginBottom: 40,
  },
  featureCard: {
    borderRadius: 12, // Equivalent to rounded-xl
    padding: 24, // Equivalent to p-6
    alignItems: 'center',
    textAlign: 'center', // Text alignment for children
    marginBottom: 20, // Space between cards
    width: '100%', // Take full width on mobile
    maxWidth: 400, // Max width for individual cards on larger screens
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5, // Shadow for Android
  },
  iconContainer: {
    padding: 12, // Equivalent to p-3
    borderRadius: 999, // Equivalent to rounded-full
    marginBottom: 16, // Equivalent to mb-4
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 20, // Equivalent to text-xl
    fontWeight: '600', // Equivalent to font-semibold
    marginBottom: 8, // Equivalent to mb-2
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 16, // Equivalent to text-base
    textAlign: 'center',
  },
  callToActionButton: {
    paddingHorizontal: 32, // Equivalent to px-8
    paddingVertical: 16, // Equivalent to py-4
    borderRadius: 999, // Equivalent to rounded-full
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow properties are set inline in the component for dynamic color
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  buttonText: {
    fontSize: 20, // Equivalent to text-xl
    fontWeight: '700', // Equivalent to font-bold
    letterSpacing: 1, // Equivalent to tracking-wide
    textTransform: 'uppercase', // Equivalent to uppercase
  },
});