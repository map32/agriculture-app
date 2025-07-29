import {categories, categoriesMapping} from '@/constants/constants';
import cropInfo from '@/assets/crop_info.json';
import cropClass from '@/assets/crop_class.json';
import { TextInput, Text, View, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import {useState, createContext, useEffect, useRef, useMemo, useCallback, FC, useContext} from 'react';
import { template } from '@babel/core';

const cropFlattened = Object.entries(cropClass).reduce((acc: any[], [category, value]) => {const _v = value.map((item) => ({...item, category: category}));return acc.concat(value)}, [])

interface DataContextType {
    search: string,
    setSearch: any,
    list: any[],
    setList: any,
    category: string | null,
    setCategory: any
}

const DataContext = createContext<DataContextType>({
    search: '',
    setSearch: null,
    list: [],
    setList: null,
    category: null,
    setCategory: null
});

const searchFn = (text: string) => {
    const items = cropFlattened;
    if (text.length === 0) return items;
    const filtered = items.filter((item) => item.svcCodeNm.includes(text) || item.svcCodeNmEng.toLowerCase().includes(text))
    return filtered;
}

const Screen = () => {
    const [search, setSearch] = useState('');
    const [list, setList] = useState<any[]>(cropFlattened);
    const [category, setCategory] = useState(null);
    useEffect(() => {
        setList(searchFn(search))
    },[search])
    return (
        <DataContext.Provider value={{search, setSearch, list, setList, category, setCategory}}>
            <View style={styles.container}>
                <View style={styles.searchRow}>
                    <SearchBar />
                </View>
                <FlatList 
                    data={list}
                    keyExtractor={(item: any) => item.svcCode}
                    style={{flex: 1}}
                    renderItem={({item}) => (
                        <TouchableOpacity>
                            <Text style={styles.text}>{item.svcCodeNmEng} ({item.svcCodeNm})</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </DataContext.Provider>
    )
}

const SearchBar = () => {
    const {search, setSearch} = useContext(DataContext);
    return (
        <View>
            <TextInput
            autoCapitalize='none'
            autoComplete='off'
            autoCorrect={false}
            onChangeText={setSearch}
            value={search}
            placeholder="Search for crops..."
            
            />
            {/* Clear button for search input */}
            {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} >
                <Text style={{ fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
            )}
        </View>
    )
}

const SearchButton = () => {
    const {search: searchText, setList} = useContext(DataContext);
    return (
        <TouchableOpacity onPress={() => setList(searchFn(searchText))}>
            <Text style={styles.text}>Search</Text>
        </TouchableOpacity>
    )
}

const Categories = () => {

}

const List = () => {

}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flex: 1,
    },
    searchRow: {
        flexDirection: 'row'
    },
    searchButton: {
        height: 40,
        width: 70,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        color: '#fff'
    }
})

export default Screen;