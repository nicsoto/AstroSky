//============================================================
//astroSky — Pantalla de ajustes
//============================================================

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../src/store/useSettingsStore';
import es from '../src/i18n/es';
import { THEME } from '../src/utils/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← {es.back}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{es.settings.title}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Visualización */}
          <SectionHeader title={es.settings.display} />

          <SettingRow label={es.settings.backgroundMode}>
            <View style={styles.segmentedControl}>
              <SegmentButton
                label={es.settings.ar}
                active={settings.backgroundMode === 'camera'}
                onPress={() => settings.setBackgroundMode('camera')}
              />
              <SegmentButton
                label={es.settings.planetarium}
                active={settings.backgroundMode === 'planetarium'}
                onPress={() => settings.setBackgroundMode('planetarium')}
              />
            </View>
          </SettingRow>

          <SettingToggle
            label={es.settings.showConstellations}
            value={settings.showConstellations}
            onToggle={settings.toggleConstellations}
          />

          <SettingToggle
            label={es.settings.showConstellationNames}
            value={settings.showConstellationNames}
            onToggle={settings.toggleConstellationNames}
          />

          <SettingToggle
            label={es.settings.showPlanetLabels}
            value={settings.showPlanetLabels}
            onToggle={settings.togglePlanetLabels}
          />

          <SettingToggle
            label={es.settings.showStarLabels}
            value={settings.showStarLabels}
            onToggle={settings.toggleStarLabels}
          />

          <SettingToggle
            label={es.settings.showDeepSky}
            value={settings.showDeepSky}
            onToggle={settings.toggleDeepSky}
          />

          <SettingToggle
            label={es.settings.showCardinals}
            value={settings.showCardinals}
            onToggle={settings.toggleCardinals}
          />

          <SettingRow label={es.settings.magnitudeLimit}>
            <Text style={styles.valueText}>
              {settings.magnitudeLimit.toFixed(1)}
            </Text>
          </SettingRow>

          {/* Efectos */}
          <SectionHeader title={es.settings.effects} />

          <SettingRow label={es.settings.twinkle}>
            <View style={styles.valueRow}>
              <TouchableOpacity
                onPress={() => settings.setTwinkleIntensity(
                  Math.max(0, settings.twinkleIntensity - 0.1)
                )}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.valueText}>
                {(settings.twinkleIntensity * 100).toFixed(0)}%
              </Text>
              <TouchableOpacity
                onPress={() => settings.setTwinkleIntensity(
                  Math.min(1, settings.twinkleIntensity + 0.1)
                )}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </SettingRow>

          {/* Sensores */}
          <SectionHeader title={es.settings.sensors} />

          <SettingRow label={es.settings.compassOffset}>
            <View style={styles.valueRow}>
              <TouchableOpacity
                onPress={() => settings.setCompassOffset(settings.compassOffset - 1)}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.valueText}>
                {settings.compassOffset.toFixed(0)}°
              </Text>
              <TouchableOpacity
                onPress={() => settings.setCompassOffset(settings.compassOffset + 1)}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </SettingRow>

          {/* Acerca de */}
          <SectionHeader title={es.settings.about} />
          <SettingRow label={es.settings.version}>
            <Text style={styles.valueText}>1.0.0</Text>
          </SettingRow>
          <SettingRow label={es.settings.dataSource}>
            <Text style={styles.valueTextSmall}>HYG, NASA, SIMBAD</Text>
          </SettingRow>

          {/* Reset */}
          <TouchableOpacity style={styles.resetBtn} onPress={settings.resetToDefaults}>
            <Text style={styles.resetBtnText}>{es.reset}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

//===== Sub-componentes =====

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const SettingRow: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <View style={styles.settingRow}>
    <Text style={styles.settingLabel}>{label}</Text>
    {children}
  </View>
);

const SettingToggle: React.FC<{
  label: string;
  value: boolean;
  onToggle: () => void;
}> = ({ label, value, onToggle }) => (
  <View style={styles.settingRow}>
    <Text style={styles.settingLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#333', true: THEME.accent }}
      thumbColor="#FFFFFF"
    />
  </View>
);

const SegmentButton: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
}> = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.segmentBtn, active && styles.segmentBtnActive]}
    onPress={onPress}
  >
    <Text
      style={[styles.segmentBtnText, active && styles.segmentBtnTextActive]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

//===== Estilos =====

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A14',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 60,
  },
  backBtnText: {
    color: THEME.accent,
    fontSize: 15,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    color: THEME.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
    paddingLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  valueText: {
    color: THEME.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  valueTextSmall: {
    color: THEME.textSecondary,
    fontSize: 12,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 2,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: THEME.accent,
  },
  segmentBtnText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: '#000',
  },
  resetBtn: {
    marginTop: 30,
    backgroundColor: 'rgba(255, 60, 60, 0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 60, 60, 0.3)',
  },
  resetBtnText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
