import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image'; // Import Image from expo-image
import cropInfo from '@/assets/crop_info.json';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const cropInfoMapping = cropInfo.reduce((mapping, item) => {mapping[item.code] = item; return mapping}, {} as {[code:string] : typeof cropInfo[0]})

// Mock data for a single crop (replace with actual data fetching based on query parameter)
// In a real app, you would fetch this data based on the 'code' passed as a route param.
const mockCropData = {
  "FT020608": {
    "code": "FT020608",
    "name": "자두", // Plum in Korean
    "cultivars": [
      {
        "name": "젤리하트(Jelly Heart)",
        "url": "https://www.nongsaro.go.kr/portal/imgView.do?ep=a5gb/CMEYLclIUPoWw9/DTnomi9S/YDfHD2ofIDhNOqPWPXCk6r5f9/5EwSYQ8lv3yKmyCCCdmcxvpDyIEWVz1uit2T0XTTE87xKdA95x2U!",
        "use": "용도 생식용",
        "function": "기능 식미"
      },
      {
        "name": "썸머스타(Summer Star)",
        "url": "https://www.nongsaro.go.kr/portal/imgView.do?ep=a5gb/CMEYLclIUPoWw9/DTnomi9S/YDfHD2ofIDhNOqPWPXCk6r5f9/5EwSYQ8lvlLpnhSbr@4F0cujZeroPxFuit2T0XTTE87xKdA95x2U!",
        "use": "용도 생식용",
        "function": "기능 식미, 재배안정성"
      },
      {
        "name": "써니퀸(Sunny Queen)",
        "url": "https://www.nongsaro.go.kr/portal/imgView.do?ep=a5gb/CMEYLclIUPoWw9/DTnomi9S/YDfHD2ofIDhNOqPWPXCk6r5f9/5EwSYQ8lvuB0Op2EG1JiSgCq/YAMPkVuit2T0XTTE87xKdA95x2U!",
        "use": "용도 생식용",
        "function": "기능 식미"
      },
      {
        "name": "썸머판타지아(Summer Fantasia)",
        "url": "https://nongsaro.go.kr/ps/img/common/anvil_img.jpg", // Placeholder image URL
        "use": "용도 생식용",
        "function": "기능 식미"
      },
      {
        "name": "하니레드(Honey Red)",
        "url": "https://www.nongsaro.go.kr/portal/imgView.do?ep=a5gb/CMEYLclIUPoWw9/DTnomi9S/YDfHD2ofIDhNOqPWPXCk6r5f9/5EwSYQ8lvN3aT5JpX4OJ8eNAy0KGRBFuit2T0XTTE87xKdA95x2U!",
        "use": "용도 생식용",
        "function": "기능 식미"
      },
      {
        "name": "퍼플퀸(Purple Queen)",
        "url": "https://www.nongsaro.go.kr/portal/imgView.do?ep=a5gb/CMEYLclIUPoWw9/DTnomi9S/YDfHD2ofIDhNOqPWPXCk6r5f9/5EwSYQ8lvNNkMOclY6bBF@BqJFnk2s1uit2T0XTTE87xKdA95x2U!",
        "use": "용도 생식용",
        "function": "기능 식미"
      }
    ],
    "tables": [
      {
        "title": "생육과정(주요농작업)", // Growth Process (Main Farm Work)
        "rows": [
          [
            { "name": "휴면기", "start_col": 0, "end_col": 4 }, // Dormancy
            { "name": "개화기", "start_col": 8, "end_col": 11 }, // Flowering
            { "name": "낙과", "start_col": 11, "end_col": 13 }, // Fruit drop
            { "name": "낙과", "start_col": 15, "end_col": 17 }, // Fruit drop
            { "name": "꽃눈분화기", "start_col": 17, "end_col": 24 }, // Flower bud differentiation
            { "name": "휴면기", "start_col": 30, "end_col": 36 } // Dormancy
          ],
          [
            { "name": "정지·전정", "start_col": 0, "end_col": 4 }, // Pruning/Training
            { "name": "묘목심기", "start_col": 7, "end_col": 10 }, // Seedling planting
            { "name": "열매솎기, 웃거름", "start_col": 13, "end_col": 17 }, // Fruit thinning, top dressing
            { "name": "수확, 가을거름(8월 하순~9월 상순)", "start_col": 18, "end_col": 26 }, // Harvest, autumn fertilizer
            { "name": "밑거름, 심기", "start_col": 31, "end_col": 34 } // Basal fertilizer, planting
          ]
        ]
      },
      {
        "title": "병해충 발생", // Pest and Disease Occurrence
        "rows": [
          [
            { "name": "주머니병", "start_col": 11, "end_col": 14 } // Pocket plum disease
          ],
          [
            { "name": "검은점무늬병/잿빛무늬병", "start_col": 12, "end_col": 23 } // Black spot disease/Gray mold disease
          ],
          [
            { "name": "깍지벌래, 진딧물", "start_col": 11, "end_col": 25 } // Scale insects, aphids
          ],
          [
            { "name": "복숭아심식나방, 복숭아유리나방, 복숭아순나방", "start_col": 13, "end_col": 28 } // Peach fruit moth, peach clearwing moth, oriental fruit moth
          ]
        ]
      },
      {
        "title": "생육과정(주요농작업) 2", // Growth Process (Main Farm Work) - Duplicate title, added "2" for distinction
        "rows": [
          [
            { "name": "휴면기", "start_col": 0, "end_col": 6 }, // Dormancy
            { "name": "발아", "start_col": 6, "end_col": 8 }, // Germination
            { "name": "개화", "start_col": 8, "end_col": 10 }, // Flowering
            { "name": "과실비대기", "start_col": 10, "end_col": 16 }, // Fruit enlargement
            { "name": "과실성숙기", "start_col": 16, "end_col": 18 }, // Fruit ripening
            { "name": "휴면기", "start_col": 30, "end_col": 36 } // Dormancy
          ],
          [
            { "name": "살구풍선기", "start_col": 8, "end_col": 9 }, // Apricot balloon stage
            { "name": "낙화기", "start_col": 10, "end_col": 11 }, // Petal fall stage
            { "name": "꽃눈분화기", "start_col": 16, "end_col": 25 }, // Flower bud differentiation
            { "name": "낙엽기", "start_col": 27, "end_col": 31 } // Leaf fall stage
          ],
          [
            { "name": "겨울전정", "start_col": 0, "end_col": 6 }, // Winter pruning
            { "name": "살구화분채취", "start_col": 8, "end_col": 9 }, // Apricot pollen collection
            { "name": "인공수분", "start_col": 9, "end_col": 10 }, // Artificial pollination
            { "name": "웃거름", "start_col": 13, "end_col": 15 }, // Top dressing
            { "name": "과실수확", "start_col": 16, "end_col": 18 }, // Fruit harvest
            { "name": "밑거름", "start_col": 26, "end_col": 32 }, // Basal fertilizer
            { "name": "월동관리", "start_col": 33, "end_col": 36 } // Winter management
          ],
          [
            { "name": "순지르기, 열매솎기", "start_col": 11, "end_col": 13 }, // Pinching, fruit thinning
            { "name": "웃자람가지 제거", "start_col": 15, "end_col": 24 }, // Removal of overgrown branches
            { "name": "낙엽제거", "start_col": 28, "end_col": 33 } // Leaf removal
          ]
        ]
      },
      {
        "title": "병충해 방제", // Pest and Disease Control
        "rows": [
          [
            { "name": "방제병해충 ▶", "start_col": 0, "end_col": 4 }, // Control pests/diseases
            { "name": "깍지벌레, 나방류 등", "start_col": 4, "end_col": 6 }, // Scale insects, moths, etc.
            { "name": "잿빛무늬병, 세균구멍병, 진딧물 등", "start_col": 6, "end_col": 10 }, // Gray mold, bacterial canker, aphids, etc.
            { "name": "세균구멍병, 노린재류 등", "start_col": 11, "end_col": 14 }, // Bacterial canker, stink bugs, etc.
            { "name": "나방류, 탄저병, 잿빛무늬병 등", "start_col": 19, "end_col": 21 }, // Moths, anthracnose, gray mold, etc.
            { "name": "유리나방, 세균구멍병 등 월동병해충", "start_col": 26, "end_col": 31 } // Clearwing moth, bacterial canker, overwintering pests/diseases
          ],
          [
            { "name": "방제약제 ▶", "start_col": 0, "end_col": 4 }, // Control agents
            { "name": "기계유 유제", "start_col": 4, "end_col": 6 }, // Machine oil emulsion
            { "name": "석회유황합제", "start_col": 6, "end_col": 7 }, // Lime sulfur mixture
            { "name": "석회보르도액", "start_col": 7, "end_col": 8 }, // Bordeaux mixture
            { "name": "적용약제", "start_col": 10, "end_col": 14 }, // Applicable pesticides
            { "name": "적용약제", "start_col": 20, "end_col": 21 }, // Applicable pesticides
            { "name": "석회보르도액, 적용약제", "start_col": 26, "end_col": 31 } // Bordeaux mixture, applicable pesticides
          ]
        ]
      }
    ],
    "cards": [
      {
        "title": "갈색고약병", // Brown spot disease
        "url": "http://ncpms.rda.go.kr/npmsAPI/thumbnailViewer2.mo?uploadSpec=npms&uploadSubDirectory=/photo/sickns/&imageFileName=8e52759e21b9c72383a495781254b6e7af5a92794075a4886d8ae06e30973a7a17fe6f078241bb06c5b4c97128956b77305b710d3effec0043efe42ccbb6de676d049319a462d87d12fcb28d9440e618"
      },
      {
        "title": "검은점무늬병", // Black spot disease
        "url": "http://ncpms.rda.go.kr/npmsAPI/thumbnailViewer2.mo?uploadSpec=npms&uploadSubDirectory=/photo/sickns/&imageFileName=10c32c93dc302490b51dd4398826998768e8691dea44bdd4fb399257de5a7fd2fb70c9e722582f23963acd172e4eaa616d6b39186942fc07109146d59c6483effe234dbb9b0b97e48b03b12ae0114e5d"
      },
      {
        "title": "궤양병", // Canker disease
        "url": "http://ncpms.rda.go.kr/npmsAPI/thumbnailViewer2.mo?uploadSpec=npms&uploadSubDirectory=/photo/sickns/&imageFileName=55cd7788e6de72f242dfd66cea91edaab8103fc81f618143060417c2e1da03b9ba599f4e741aaed1a44c78ffdba2f7c4"
      },
      {
        "title": "세균구멍병", // Bacterial shot hole disease
        "url": "http://ncpms.rda.go.kr/npmsAPI/thumbnailViewer2.mo?uploadSpec=npms&uploadSubDirectory=/photo/sickns/&imageFileName=bb53a02932991be6302f38f62fdd99f720f96f63b81de5c7ec64c4d2af16a3a42d0b4859e8b9730a822604375e358bfd7a62e495bdb0f49fcaacd64cdfd4183a"
      },
      {
        "title": "자두곰보병", // Plum pox virus
        "url": "http://ncpms.rda.go.kr/npmsAPI/thumbnailViewer2.mo?uploadSpec=npms&uploadSubDirectory=/photo/sickns/&imageFileName=ad12c0ae9dccb81e1a43e6e196d98d004575ecd1d97a3dd1e87ff59626ff4ba4d3733389a9215e7d22140616acb83388"
      },
      {
        "title": "잿빛곰팡이병", // Gray mold disease
        "url": "http://ncpms.rda.go.kr/npmsAPI/thumbnailViewer2.mo?uploadSpec=npms&uploadSubDirectory=/photo/sickns/&imageFileName=db950910dd23eacbf91f5019cdde865ab721aee451150fffb319b3bc51e9a6a75e9c81a485be405977bd53f21803be424ca74ce8550a3f16cb22653f18aa6847"
      },
      {
        "title": "잿빛무늬병", // Gray leaf spot disease
        "url": "http://ncpms.rda.go.kr/npmsAPI/thumbnailViewer2.mo?uploadSpec=npms&uploadSubDirectory=/photo/sickns/&imageFileName=c46207427a5f2697e790a31378c682e77c84031832da438d59fb3f125f471a1f9485a76613f468dfc3e8c6e826314fd9a8580e64fa5c432792001e9c7283f26943ccb7d5ef5b73b8822c874a589c18de"
      },
      {
        "title": "주머니병", // Pocket plum disease
        "url": "http://ncpms.rda.go.kr/npmsAPI/thumbnailViewer2.mo?uploadSpec=npms&uploadSubDirectory=/photo/sickns/&imageFileName=039830993215d40857ab6796a60463cb5e62c71cd323964b3d945e272f6b49bd782226e31cd4ae9b0a84c2ba3ef539c3fe234dbb9b0b97e48b03b12ae0114e5d"
      },
      {
        "title": "호프왜화바이로이드", // Hop stunt viroid
        "url": "http://ncpms.rda.go.kr/npmsAPI/thumbnailViewer2.mo?uploadSpec=npms&uploadSubDirectory=/photo/sickns/&imageFileName=d7d22fa19633d45aec1a13a222200bdd491c70d5c0cc232868a01701f5db5c5e096b31e5700f1f11fbfac30f67e0a6a609899e732a56371be71f2c5a85b65f7304c6830e22e30ec85bfa527550498ee57facc6063a77b0a3395279e7b7096342"
      },
      {
        "title": "벗나무사향하늘소", // Cherry longhorn beetle
        "url": "http://ncpms.rda.go.kr/npmsAPI/thumbnailViewer2.mo?uploadSpec=npms&uploadSubDirectory=/photo/hlsct/&imageFileName=e56ac28fef279b313fbabde81cf8e463a165008d0ef0a9599237b4f7f7b7c5f4bb8e0823f4fd52d115cb37d7a544ab390cd4e130b4ba63b6a381000c9489ac4e878fb960525388ac2c0f3d81f62f0dad"
      },
      {
        "title": "복숭아순나방붙이", // Smaller peach fruit moth
        "url": "http://ncpms.rda.go.kr/npmsAPI/thumbnailViewer2.mo?uploadSpec=npms&uploadSubDirectory=/photo/hlsct/&imageFileName=1231a2f66c4eb2c68946c32dd8c5185ca507d28a78c60cbba5ffb16e47600bc0c3902e433b8ac45be95fd1da7989829681310af6d3725ac82fbd879eb6a61f5be0f8565a7fb33b8cae008c282b7895b9"
      }
    ]
  }
};

// Define the color palette
const colors = {
  primaryGreen: 'rgba(23, 190, 126, 1)',
  darkGreen: 'rgba(6, 172, 108, 1)',
  white: '#FFFFFF',
  lightGray: '#F0F4F8',
  darkGray: '#4B5563',
  textBlack: '#1F2937',
  borderColor: '#D1D5DB',
  timelineFill: 'rgba(23, 190, 126, 0.6)', // Lighter green for timeline bars
  timelineGrid: '#E5E7EB', // Light gray for timeline grid lines
};

// Helper to get screen width for responsive design
const { width: screenWidth } = Dimensions.get('window');
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// CropDetailScreen Component
const CropDetailScreen = () => {
  // In a real app, you'd get the cropCode from route.params.
  // For this example, we'll hardcode it to 'FT020608' to use the mock data.
  // const { cropCode } = route.params;
  const params = useLocalSearchParams<{code: string}>();
  const cropCode = params.code;
  const insets = useSafeAreaInsets();

  const [cropData, setCropData] = useState<any>(mockCropData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    // Simulate data fetching
    if (cropInfoMapping[cropCode]) {
      setCropData(cropInfoMapping[cropCode]);
      setLoading(false);
    } else {
      setError("Crop data not found.");
      setLoading(false);
    }
  }, [cropCode]); // Depend on cropCode

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.lightGray }]}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
        <Text style={{ color: colors.darkGray, marginTop: 10 }}>Loading crop information...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.lightGray }]}>
        <Text style={{ color: 'red', fontSize: 16 }}>Error: {error}</Text>
      </View>
    );
  }

  if (!cropData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.lightGray }]}>
        <Text style={{ color: colors.darkGray }}>No crop data available.</Text>
      </View>
    );
  }

  // Component to render a single timeline row
  const TimelineRow = ({ data, isHeader = false }: {data: Record<string,any>[], isHeader?: boolean}) => {
    const totalCols = 36; // 3 columns per month * 12 months
    const indices = [...Array(totalCols).keys()];
    return (
      <View style={styles.timelineRow}>
        {indices.map((month, index) => (
          <View key={index} style={[styles.monthColumn,
            { borderLeftColor: colors.timelineGrid },
            {left: `${index / totalCols * 100}%`,
            width: `${(screenWidth * 2) / totalCols}%`,}]}>
          </View>
        ))}
        {!isHeader && data.map((item, index) => {
          const startPercentage = (item.start_col / totalCols) * 100;
          const widthPercentage = ((item.end_col - item.start_col) / totalCols) * 100;
          return (
            <View
              key={index}
              style={[
                styles.timelineActivity,
                {
                  left: `${startPercentage}%`,
                  width: `${widthPercentage}%`,
                  backgroundColor: colors.timelineFill,
                },
              ]}
            >
              <Text style={styles.timelineActivityText}>{item.name}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.lightGray }, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <Text style={[styles.cropName, { color: colors.textBlack }]}>{cropData.name}</Text>
      </View>

      {cropData.cultivars && cropData.cultivars.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textBlack }]}>품종 (Cultivars)</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={cropData.cultivars}
            keyExtractor={(item, index) => `cultivar-${index}`}
            renderItem={({ item }) => (
              <View style={[styles.cultivarCard, { backgroundColor: colors.white, borderColor: colors.borderColor }]}>
                <Image
                  style={styles.cultivarImage}
                  source={{ uri: item.url }}
                  placeholder={{ uri: `https://placehold.co/100x100/${colors.lightGray.substring(1)}/${colors.darkGray.substring(1)}?text=No+Image` }}
                  contentFit="cover"
                  transition={200}
                />
                <Text style={[styles.cultivarName, { color: colors.textBlack }]}>{item.name}</Text>
                <Text style={[styles.cultivarDetail, { color: colors.darkGray }]}>{item.use}</Text>
                <Text style={[styles.cultivarDetail, { color: colors.darkGray }]}>{item.function}</Text>
              </View>
            )}
          />
        </View>
      )}

      {cropData.tables && Object.keys(cropData.tables).length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textBlack }]}>생육 및 병해충 정보 (Growth & Pest Info)</Text>
          {Object.values(cropData.tables).map((tblData: any, tblIndex: number) => (<>
              <Text style={styles.tableTitle}>{tblData.title}</Text>
            {
              tblData.tables.map((table: Record<string,any>, tableIndex: number) => (
                <View key={tableIndex} style={[styles.tableContainer, { borderColor: colors.borderColor }]}>
                  <Text style={[styles.tableTitle, { color: colors.textBlack }]}>{table.title}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View style={styles.timelineGridContainer}>
                      {/* Month Headers */}
                      <View style={styles.monthHeaderRow}>
                        {MONTHS.map((month, index) => (
                          <View key={index} style={styles.monthHeaderCell}>
                            <Text style={[styles.monthHeaderText, { color: colors.darkGray }]}>{month}</Text>
                          </View>
                        ))}
                      </View>
                      {/* Timeline Rows */}
                      {table.rows.map((row: Record<string,any>[], rowIndex: number) => (
                        <TimelineRow data={row} />
                      ))}
                    </View>
                  </ScrollView>
                </View>
              ))
            }</>
          ))}
        </View>
      )}

      {cropData.cards && cropData.cards.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textBlack }]}>병해충 상세 (Pest & Disease Details)</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={cropData.cards}
            keyExtractor={(item, index) => `card-${index}`}
            renderItem={({ item }) => (
              <View style={[styles.pestCard, { backgroundColor: colors.white, borderColor: colors.borderColor }]}>
                <Image
                  style={styles.pestImage}
                  source={{ uri: item.url }}
                  placeholder={{ uri: `https://placehold.co/100x100/${colors.lightGray.substring(1)}/${colors.darkGray.substring(1)}?text=No+Image` }}
                  contentFit="cover"
                  transition={200}
                />
                <Text style={[styles.pestTitle, { color: colors.textBlack }]}>{item.title}</Text>
              </View>
            )}
          />
        </View>
      )}

      <View style={{ height: 50 }} /> {/* Spacer at the bottom */}
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
    alignItems: 'center',
    marginBottom: 10,
  },
  cropName: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: colors.white,
    borderRadius: 10,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  cultivarCard: {
    width: 150, // Fixed width for horizontal scroll
    marginRight: 15,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 1.5,
  },
  cultivarImage: {
    width: 100,
    height: 100,
    borderRadius: 50, // Circular image
    marginBottom: 10,
    backgroundColor: colors.lightGray, // Placeholder background
  },
  cultivarName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  cultivarDetail: {
    fontSize: 12,
    textAlign: 'center',
  },
  tableContainer: {
    marginTop: 15,
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden', // Ensures timeline bars don't spill
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 1.5,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
    textAlign: 'center',
  },
  timelineGridContainer: {
    width: screenWidth * 2, // Make it wider to accommodate 36 columns (2x screen width as a base)
    minWidth: 720, // Minimum width for 36 columns (20px per column * 36)
    position: 'relative',
    paddingVertical: 10,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.timelineGrid,
  },
  monthHeaderCell: {
    width: (screenWidth * 2) / 12, // Each month takes 3 columns, so 1/12 of total timeline width
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  monthHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timelineRow: {
    flexDirection: 'row',
    height: 40, // Height of each timeline row
    alignItems: 'center',
    position: 'relative', // For absolute positioning of activities
    
    borderBottomWidth: 0.5,
    borderBottomColor: colors.timelineGrid,
  },
  monthColumn: {
    position: 'absolute',
    height: '100%',
    borderLeftWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  monthLabel: {
    fontSize: 10,
    position: 'absolute',
    top: 5,
    left: 5,
    opacity: 0.7, // Subtle month label
  },
  timelineActivity: {
    position: 'absolute',
    height: 30, // Height of the activity bar
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    zIndex: 1, // Ensure it's above grid lines
  },
  timelineActivityText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pestCard: {
    width: 120, // Fixed width for horizontal scroll
    marginRight: 15,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 1.5,
  },
  pestImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: colors.lightGray, // Placeholder background
  },
  pestTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CropDetailScreen;