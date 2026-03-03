//============================================================
//astroSky — Pantalla de búsqueda completa
//============================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import es from '../src/i18n/es';
import { THEME } from '../src/utils/colors';
import messierData from '../src/data/catalogs/messier.json';

//categorías rápidas
const QUICK_CATEGORIES = [
  { key: 'planets', label: es.searchScreen.categories.planets, icon: '🪐' },
  { key: 'stars', label: es.searchScreen.categories.stars, icon: '⭐' },
  { key: 'constellations', label: es.searchScreen.categories.constellations, icon: '✨' },
  { key: 'deepSky', label: es.searchScreen.categories.deepSky, icon: '🌌' },
];

//planetas del sistema solar
const SOLAR_SYSTEM = [
  { name: 'Sun', nameEs: 'Sol', icon: '☀️' },
  { name: 'Moon', nameEs: 'Luna', icon: '🌙' },
  { name: 'Mercury', nameEs: 'Mercurio', icon: '⚫' },
  { name: 'Venus', nameEs: 'Venus', icon: '🟡' },
  { name: 'Mars', nameEs: 'Marte', icon: '🔴' },
  { name: 'Jupiter', nameEs: 'Júpiter', icon: '🟤' },
  { name: 'Saturn', nameEs: 'Saturno', icon: '🪐' },
  { name: 'Uranus', nameEs: 'Urano', icon: '🔵' },
  { name: 'Neptune', nameEs: 'Neptuno', icon: '🔵' },
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    //auto-focus el input
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  //filtrar resultados según categoría
  const categoryResults = useCallback(() => {
    if (!activeCategory) return [];

    switch (activeCategory) {
      case 'planets':
        return SOLAR_SYSTEM.map((p) => ({
          id: `planet_${p.name}`,
          name: p.nameEs,
          subtitle: es.objectTypes.planet,
          icon: p.icon,
        }));
      case 'constellations': {
        const constNames = es.constellationNames as Record<string, string>;
        return Object.entries(constNames)
          .sort((a, b) => a[1].localeCompare(b[1]))
          .map(([abbr, name]) => ({
            id: `const_${abbr}`,
            name,
            subtitle: abbr,
            icon: '✨',
          }));
      }
      case 'deepSky':
        return messierData.map((m) => ({
          id: `messier_${m.messier}`,
          name: `M${m.messier} — ${m.nameEs || m.name}`,
          subtitle:
            es.objectTypes[m.type as keyof typeof es.objectTypes] || m.type,
          icon: '🌌',
        }));
      case 'stars':
        //estrellas destacadas (hardcoded subset)
        return [
          { id: 'star_sirius', name: 'Sirio', subtitle: 'α CMa · mag -1.46', icon: '⭐' },
          { id: 'star_canopus', name: 'Canopus', subtitle: 'α Car · mag -0.74', icon: '⭐' },
          { id: 'star_arcturus', name: 'Arturo', subtitle: 'α Boo · mag -0.05', icon: '⭐' },
          { id: 'star_vega', name: 'Vega', subtitle: 'α Lyr · mag 0.03', icon: '⭐' },
          { id: 'star_capella', name: 'Capella', subtitle: 'α Aur · mag 0.08', icon: '⭐' },
          { id: 'star_rigel', name: 'Rigel', subtitle: 'β Ori · mag 0.13', icon: '⭐' },
          { id: 'star_betelgeuse', name: 'Betelgeuse', subtitle: 'α Ori · mag 0.42', icon: '⭐' },
          { id: 'star_aldebaran', name: 'Aldebarán', subtitle: 'α Tau · mag 0.85', icon: '⭐' },
          { id: 'star_antares', name: 'Antares', subtitle: 'α Sco · mag 0.96', icon: '⭐' },
          { id: 'star_spica', name: 'Espiga', subtitle: 'α Vir · mag 0.97', icon: '⭐' },
          { id: 'star_pollux', name: 'Pólux', subtitle: 'β Gem · mag 1.14', icon: '⭐' },
          { id: 'star_fomalhaut', name: 'Fomalhaut', subtitle: 'α PsA · mag 1.16', icon: '⭐' },
          { id: 'star_deneb', name: 'Deneb', subtitle: 'α Cyg · mag 1.25', icon: '⭐' },
          { id: 'star_achernar', name: 'Achernar', subtitle: 'α Eri · mag 0.46', icon: '⭐' },
          { id: 'star_acrux', name: 'Ácrux', subtitle: 'α Cru · mag 0.76', icon: '⭐' },
        ];
      default:
        return [];
    }
  }, [activeCategory]);

  const results = categoryResults();

  //filtrar por query de texto
  const filteredResults = query.length >= 1
    ? results.filter((r) =>
        r.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .includes(
            query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          )
      )
    : results;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header con búsqueda */}
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={es.searchScreen.placeholder}
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>{es.cancel}</Text>
            </TouchableOpacity>
          </View>

          {/* Categorías rápidas */}
          <View style={styles.categories}>
            {QUICK_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryBtn,
                  activeCategory === cat.key && styles.categoryBtnActive,
                ]}
                onPress={() =>
                  setActiveCategory(
                    activeCategory === cat.key ? null : cat.key
                  )
                }
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    activeCategory === cat.key && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lista de resultados */}
        {filteredResults.length > 0 ? (
          <FlatList
            data={filteredResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => {
                  //navegar al detalle o volver a main con el objeto
                  router.back();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.resultIcon}>{item.icon}</Text>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.pointToBtn}>
                  {es.searchScreen.pointTo} →
                </Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
          />
        ) : (
          <View style={styles.emptyState}>
            {activeCategory ? (
              <Text style={styles.emptyText}>
                {es.searchScreen.noResults}
              </Text>
            ) : (
              <Text style={styles.emptyText}>
                Seleccioná una categoría o escribí un nombre
              </Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A14',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 15,
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelText: {
    color: THEME.accent,
    fontSize: 14,
  },
  categories: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  categoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 4,
  },
  categoryBtnActive: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderWidth: 1,
    borderColor: THEME.accent,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: THEME.accent,
  },
  list: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  resultIcon: {
    fontSize: 22,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  resultSubtitle: {
    color: THEME.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  pointToBtn: {
    color: THEME.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: THEME.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
