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
    const filtered = items.filter((item) => item.svcCodeNm.includes(text) || item.svcCodeNmEng.toLowerCase().includes(text))
    return filtered;
}

const Screen = () => {
    const [search, setSearch] = useState('');
    const [list, setList] = useState<any[]>(cropFlattened);
    const [category, setCategory] = useState(null);
    return (
        <DataContext.Provider value={{search, setSearch, list, setList, category, setCategory}}>
            <View style={styles.container}>
                <View style={styles.searchRow}>
                    <SearchBar />
                    <SearchButton />
                </View>
                <FlatList 
                    data={list}
                    keyExtractor={(item: any) => item.svcCode}
                    style={{flex: 1}}
                    renderItem={({item}) => (
                        <TouchableOpacity>
                            <Text style={styles.text}>{item.svcCodeNmEng}</Text>
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
        <TextInput 
            autoCapitalize='none'
            onChangeText={setSearch}
            style={{flex: 1, height: 40, color: '#fff'}}
        />
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