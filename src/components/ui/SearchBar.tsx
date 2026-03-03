//============================================================
//astroSky — Barra de búsqueda flotante
//============================================================

import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import type { CelestialObject } from '../../data/types';
import type { StarCatalog } from '../../data/loaders/starCatalog';
import es from '../../i18n/es';
import { THEME } from '../../utils/colors';
import messierData from '../../data/catalogs/messier.json';

interface SearchBarProps {
  starCatalog: StarCatalog | null;
  onSelectObject: (object: CelestialObject) => void;
  planets: Array<{ name: string; nameEs?: string; magnitude: number; ra: number; dec: number }>;
}

interface SearchResult {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  magnitude: number;
  object: CelestialObject;
}

/**
 *barra de búsqueda con resultados en tiempo real.
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  starCatalog,
  onSelectObject,
  planets,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);

      if (text.length < 2) {
        setResults([]);
        return;
      }

      const q = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const found: SearchResult[] = [];
      const MAX_RESULTS = 20;

      //buscar en estrellas
      if (starCatalog) {
        for (const star of starCatalog.stars) {
          if (found.length >= MAX_RESULTS) break;
          const nameNorm = (star.proper || star.name || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          const bayerNorm = (star.bayer || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

          if (nameNorm.includes(q) || bayerNorm.includes(q)) {
            found.push({
              id: `star_${star.hip}`,
              name: star.proper || star.bayer || star.name || `HIP ${star.hip}`,
              type: 'star',
              typeLabel: es.objectTypes.star,
              magnitude: star.magnitude,
              object: star as unknown as CelestialObject,
            });
          }
        }
      }

      //buscar en planetas
      for (const planet of planets) {
        if (found.length >= MAX_RESULTS) break;
        const displayName = planet.nameEs ?? planet.name;
        const nameNorm = displayName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        if (nameNorm.includes(q) || planet.name.toLowerCase().includes(q)) {
          found.push({
            id: `planet_${planet.name}`,
            name: displayName,
            type: 'planet',
            typeLabel: es.objectTypes.planet,
            magnitude: planet.magnitude,
            object: planet as unknown as CelestialObject,
          });
        }
      }

      //buscar en objetos Messier
      for (const obj of messierData) {
        if (found.length >= MAX_RESULTS) break;
        const nameNorm = (obj.nameEs || obj.name)
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        const messierRef = `m${obj.messier}`;
        if (
          nameNorm.includes(q) ||
          messierRef.includes(q) ||
          obj.name.toLowerCase().includes(q)
        ) {
          found.push({
            id: `messier_${obj.messier}`,
            name: obj.nameEs || obj.name,
            type: obj.type,
            typeLabel:
              es.objectTypes[obj.type as keyof typeof es.objectTypes] || obj.type,
            magnitude: obj.magnitude,
            object: obj as unknown as CelestialObject,
          });
        }
      }

      //buscar en constelaciones
      const constNames = es.constellationNames as Record<string, string>;
      for (const [abbr, name] of Object.entries(constNames)) {
        if (found.length >= MAX_RESULTS) break;
        const nameNorm = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        if (nameNorm.includes(q) || abbr.toLowerCase().includes(q)) {
          found.push({
            id: `const_${abbr}`,
            name,
            type: 'constellation',
            typeLabel: 'Constelación',
            magnitude: 0,
            object: {
              name: abbr,
              nameEs: name,
              type: 'star' as const,
              ra: 0,
              dec: 0,
              magnitude: 0,
            } as CelestialObject,
          });
        }
      }

      setResults(found);
    },
    [starCatalog, planets]
  );

  const handleSelect = useCallback(
    (item: SearchResult) => {
      onSelectObject(item.object);
      setQuery('');
      setResults([]);
      setFocused(false);
      Keyboard.dismiss();
    },
    [onSelectObject]
  );

  const renderItem = useCallback(
    ({ item }: { item: SearchResult }) => (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.resultInfo}>
          <Text style={styles.resultName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.resultType}>{item.typeLabel}</Text>
        </View>
        {item.type !== 'constellation' && (
          <Text style={styles.resultMag}>
            mag {item.magnitude.toFixed(1)}
          </Text>
        )}
      </TouchableOpacity>
    ),
    [handleSelect]
  );

  return (
    <View style={[styles.container, focused && styles.containerFocused]}>
      <View style={styles.inputContainer}>
        <Text style={styles.searchIcon}>🔭</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={es.main.search}
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={query}
          onChangeText={handleSearch}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            if (!query) setFocused(false);
          }}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              setResults([]);
            }}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de resultados */}
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          maxToRenderPerBatch={10}
        />
      )}

      {/* Sin resultados */}
      {query.length >= 2 && results.length === 0 && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>
            {es.searchScreen.noResults}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 110,
    left: 16,
    right: 16,
    zIndex: 25,
  },
  containerFocused: {
    //expandir cuando está enfocado
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 30, 0.85)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  resultsList: {
    backgroundColor: 'rgba(15, 15, 30, 0.95)',
    borderRadius: 14,
    marginTop: 4,
    maxHeight: 250,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultType: {
    color: THEME.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  resultMag: {
    color: THEME.textSecondary,
    fontSize: 12,
  },
  noResults: {
    backgroundColor: 'rgba(15, 15, 30, 0.95)',
    borderRadius: 14,
    marginTop: 4,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  noResultsText: {
    color: THEME.textSecondary,
    fontSize: 14,
  },
});
