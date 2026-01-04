// app/_layout.jsx
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Home, Server, Map, Settings, Stethoscope } from 'lucide-react-native';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#1a1a1a',
            borderTopColor: '#2a2a2a',
            borderTopWidth: 1,
            height: 80,
            paddingBottom: 30,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#666',
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Overview',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="vets/index"
          options={{
            title: 'Help',
            tabBarIcon: ({ color, size }) => <Stethoscope  size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          }}
        />
         <Tabs.Screen
          name="vets/support"
          options={{
            title: 'Tech',
            tabBarIcon: ({ color, size }) => <Server size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="animal/[id]"
          options={{
            href: null,
            title: 'Animal Details',
          }}
        />
         <Tabs.Screen
          name="manage"
          options={{
            href: null,
            title: 'Animal Details',
          }}
        />
       
      </Tabs>
    </>
  );
}