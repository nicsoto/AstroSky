//============================================================
//astroSky — Pantalla de detalle de objeto celeste
//============================================================

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import es from '../../src/i18n/es';
import { THEME } from '../../src/utils/colors';
import { searchNasaImages } from '../../src/services/api/nasaApi';
import { getSimbadDetails } from '../../src/services/api/simbadApi';

export default function ObjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [nasaImages, setNasaImages] = useState<
    Array<{ title: string; url: string; description: string }>
  >([]);
  const [simbadInfo, setSimbadInfo] = useState<any>(null);
  const [loadingImages, setLoadingImages] = useState(true);

  //decodificar el nombre del objeto del ID
  const objectName = decodeURIComponent(id || '').replace(/_/g, ' ');

  useEffect(() => {
    //buscar imágenes de NASA
    const fetchData = async () => {
      setLoadingImages(true);
      try {
        const [images, details] = await Promise.all([
          searchNasaImages(objectName, 3),
          getSimbadDetails(objectName),
        ]);
        setNasaImages(images);
        setSimbadInfo(details);
      } catch (e) {
        console.warn('[ObjectDetail] Error fetching data:', e);
      } finally {
        setLoadingImages(false);
      }
    };

    if (objectName) fetchData();
  }, [objectName]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← {es.back}</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {objectName}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Datos de SIMBAD */}
          {simbadInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datos astronómicos</Text>
              <InfoRow label="ID principal" value={simbadInfo.mainId} />
              <InfoRow label="Tipo" value={simbadInfo.objectType} />
              {simbadInfo.spectralType && (
                <InfoRow label="Tipo espectral" value={simbadInfo.spectralType} />
              )}
              {simbadInfo.magnitude && (
                <InfoRow label="Magnitud" value={simbadInfo.magnitude.toFixed(2)} />
              )}
              <InfoRow
                label="AR"
                value={`${simbadInfo.ra?.toFixed(4)}°`}
              />
              <InfoRow
                label="Dec"
                value={`${simbadInfo.dec?.toFixed(4)}°`}
              />
              {simbadInfo.redshift && (
                <InfoRow label="Redshift" value={simbadInfo.redshift.toFixed(6)} />
              )}
            </View>
          )}

          {/* Imágenes de NASA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imágenes (NASA)</Text>
            {loadingImages ? (
              <ActivityIndicator color={THEME.accent} style={{ marginTop: 20 }} />
            ) : nasaImages.length > 0 ? (
              nasaImages.map((img, i) => (
                <View key={i} style={styles.imageCard}>
                  {img.url ? (
                    <Image
                      source={{ uri: img.url }}
                      style={styles.nasaImage}
                      resizeMode="cover"
                    />
                  ) : null}
                  <Text style={styles.imageTitle}>{img.title}</Text>
                  <Text style={styles.imageDesc} numberOfLines={4}>
                    {img.description}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>
                No se encontraron imágenes para este objeto.
              </Text>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

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
  backBtn: { width: 60 },
  backBtnText: { color: THEME.accent, fontSize: 15 },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: THEME.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  infoLabel: {
    color: THEME.textSecondary,
    fontSize: 13,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  imageCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  nasaImage: {
    width: '100%',
    height: 200,
  },
  imageTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    padding: 12,
    paddingBottom: 4,
  },
  imageDesc: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  noData: {
    color: THEME.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
  },
});
