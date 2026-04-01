import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const APP_VERSION = '1.0.0';

export default function SettingsScreen({ navigation }) {
  const { colors: C, isDark, toggleTheme } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  // Notification prefs
  const [notifJobs,      setNotifJobs]      = useState(true);
  const [notifHousing,   setNotifHousing]   = useState(true);
  const [notifVisa,      setNotifVisa]      = useState(true);
  const [notifCommunity, setNotifCommunity] = useState(true);
  const [notifMessages,  setNotifMessages]  = useState(true);
  const [notifAI,        setNotifAI]        = useState(false);

  // Privacy
  const [profilePublic,  setProfilePublic]  = useState(true);
  const [showLocation,   setShowLocation]   = useState(true);
  const [anonMode,       setAnonMode]       = useState(false);
  const [dataSharing,    setDataSharing]    = useState(false);

  // Language
  const [language, setLanguage] = useState('English');
  const LANGUAGES = ['English', 'বাংলা', 'हिन्दी', 'Español', 'العربية', 'Français', 'Português', '中文'];
  const [showLangs, setShowLangs] = useState(false);

  const ToggleRow = ({ icon, bg, label, sub, value, onChange }) => (
    <View style={s.toggleRow}>
      <View style={[s.rowIcon, { backgroundColor: bg }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={s.rowText}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.card3, true: C.vivid + '88' }}
        thumbColor={value ? C.vivid : C.c35}
      />
    </View>
  );

  const TapRow = ({ icon, bg, label, sub, right, onPress, danger }) => (
    <TouchableOpacity style={s.toggleRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.rowIcon, { backgroundColor: bg }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={s.rowText}>
        <Text style={[s.rowLabel, danger && { color: C.vivid }]}>{label}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      <Text style={s.rowRight}>{right || '›'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, gap: 20 }} showsVerticalScrollIndicator={false}>

        {/* Appearance */}
        <View>
          <Text style={s.sectionLabel}>APPEARANCE</Text>
          <View style={s.card}>
            <ToggleRow
              icon={isDark ? '🌙' : '☀️'} bg={isDark ? C.card3 : C.goldD}
              label={isDark ? 'Dark Mode' : 'Light Mode'}
              sub={isDark ? 'Switch to light background' : 'Switch to dark background'}
              value={!isDark} onChange={toggleTheme}
            />
          </View>
        </View>

        {/* Language */}
        <View>
          <Text style={s.sectionLabel}>LANGUAGE</Text>
          <View style={s.card}>
            <TouchableOpacity style={s.toggleRow} onPress={() => setShowLangs(p => !p)} activeOpacity={0.7}>
              <View style={[s.rowIcon, { backgroundColor: C.blueD }]}>
                <Text style={{ fontSize: 16 }}>🌐</Text>
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>App Language</Text>
                <Text style={s.rowSub}>{language}</Text>
              </View>
              <Text style={s.rowRight}>{showLangs ? '∧' : '›'}</Text>
            </TouchableOpacity>
            {showLangs && (
              <View style={s.langGrid}>
                {LANGUAGES.map(l => (
                  <TouchableOpacity
                    key={l}
                    style={[s.langPill, language === l && { backgroundColor: C.blueD, borderColor: C.blue + '55' }]}
                    onPress={() => { setLanguage(l); setShowLangs(false); }}
                  >
                    <Text style={[s.langTxt, language === l && { color: C.blue, fontWeight: '700' }]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Notifications */}
        <View>
          <Text style={s.sectionLabel}>NOTIFICATIONS</Text>
          <View style={s.card}>
            <ToggleRow icon="💼" bg={C.greenD}  label="Job Alerts"         sub="New OPT/STEM job listings"       value={notifJobs}      onChange={setNotifJobs}      />
            <View style={s.divider} />
            <ToggleRow icon="🏠" bg={C.goldD}   label="Housing Alerts"     sub="New immigrant-friendly listings"  value={notifHousing}   onChange={setNotifHousing}   />
            <View style={s.divider} />
            <ToggleRow icon="📋" bg={C.vividD}  label="Visa Reminders"     sub="Deadlines & USCIS updates"        value={notifVisa}      onChange={setNotifVisa}      />
            <View style={s.divider} />
            <ToggleRow icon="🏘️" bg={C.tealD}   label="Community"          sub="Replies, mentions & events"       value={notifCommunity} onChange={setNotifCommunity} />
            <View style={s.divider} />
            <ToggleRow icon="💬" bg={C.purpleD} label="Messages"           sub="New messages & AI replies"        value={notifMessages}  onChange={setNotifMessages}  />
            <View style={s.divider} />
            <ToggleRow icon="🤖" bg={C.vividD}  label="AI Proactive Tips"  sub="Personalized visa & job tips"     value={notifAI}        onChange={setNotifAI}        />
          </View>
        </View>

        {/* Privacy */}
        <View>
          <Text style={s.sectionLabel}>PRIVACY</Text>
          <View style={s.card}>
            <ToggleRow icon="👤" bg={C.blueD}   label="Public Profile"      sub="Anyone can see your profile"     value={profilePublic} onChange={setProfilePublic}  />
            <View style={s.divider} />
            <ToggleRow icon="📍" bg={C.greenD}  label="Show Location"       sub="Display city on your profile"    value={showLocation}  onChange={setShowLocation}   />
            <View style={s.divider} />
            <ToggleRow icon="🕵️" bg={C.card3}   label="Anonymous Mode"      sub="Hide identity in community"      value={anonMode}      onChange={setAnonMode}       />
            <View style={s.divider} />
            <ToggleRow icon="📊" bg={C.purpleD} label="Analytics Sharing"   sub="Help improve Zabroad"            value={dataSharing}   onChange={setDataSharing}    />
          </View>
        </View>

        {/* Account */}
        <View>
          <Text style={s.sectionLabel}>ACCOUNT</Text>
          <View style={s.card}>
            <TapRow icon="🔑" bg={C.vividD}  label="Change Password"    sub="Update your login password"     />
            <View style={s.divider} />
            <TapRow icon="📧" bg={C.blueD}   label="Change Email"       sub="azizur@email.com"               />
            <View style={s.divider} />
            <TapRow icon="📱" bg={C.greenD}  label="Phone Number"       sub="Not set"                        right="Add ›" />
            <View style={s.divider} />
            <TapRow icon="🔐" bg={C.goldD}   label="Two-Factor Auth"    sub="Not enabled"                    right="Enable ›" />
          </View>
        </View>

        {/* Support */}
        <View>
          <Text style={s.sectionLabel}>SUPPORT</Text>
          <View style={s.card}>
            <TapRow icon="💬" bg={C.tealD}   label="Contact Support"    sub="Get help from our team"         />
            <View style={s.divider} />
            <TapRow icon="⭐" bg={C.goldD}   label="Rate Zabroad"       sub="Share your feedback"            />
            <View style={s.divider} />
            <TapRow icon="📄" bg={C.blueD}   label="Terms of Service"                                        />
            <View style={s.divider} />
            <TapRow icon="🔒" bg={C.purpleD} label="Privacy Policy"                                          />
          </View>
        </View>

        {/* Danger zone */}
        <View>
          <Text style={s.sectionLabel}>DANGER ZONE</Text>
          <View style={s.card}>
            <TapRow icon="🗑️" bg={C.vividD}  label="Delete Account"     sub="Permanently remove all data"    danger />
          </View>
        </View>

        {/* Version */}
        <View style={s.versionRow}>
          <Text style={{ fontSize: 24 }}>🌍</Text>
          <Text style={[s.versionTxt, { color: C.c35 }]}>Zabroad v{APP_VERSION}</Text>
          <Text style={[s.versionTxt, { color: C.c35 }]}>Made with ❤️ for immigrants</Text>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={[s.signOutBtn, { borderColor: C.border }]} activeOpacity={0.8} onPress={() => navigation.replace('Welcome')}>
          <Text style={[s.signOutTxt, { color: C.c35 }]}>🚪 Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.nav },
  backBtn: { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 24, color: C.cream, lineHeight: 28 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.cream },
  scroll: { flex: 1 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 8, paddingHorizontal: 4 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: C.cream, marginBottom: 2 },
  rowSub: { fontSize: 11, color: C.c35 },
  rowRight: { fontSize: 16, color: C.c35 },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14, paddingTop: 4 },
  langPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border },
  langTxt: { fontSize: 13, color: C.c35 },
  versionRow: { alignItems: 'center', gap: 6, paddingTop: 4 },
  versionTxt: { fontSize: 12 },
  signOutBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  signOutTxt: { fontSize: 14, fontWeight: '600' },
});
