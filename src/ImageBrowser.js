import React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Dimensions,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native'
import * as MediaLibrary from 'expo-media-library'
import ImageTile from './ImageTile'

const {width} = Dimensions.get('window');

export default class ImageBrowser extends React.Component {
  state = {
    photos: [],
    selected: [],
    isEmpty: false,
    after: null,
    hasNextPage: true
  }

  componentDidMount() {
    this.getPhotos()
  }

  selectImage = (index) => {
    let newSelected = Array.from(this.state.selected);
    if (newSelected.indexOf(index) === -1) {
      newSelected.push(index)
    } else {
      const deleteIndex = newSelected.indexOf(index)
      newSelected.splice(deleteIndex, 1)
    }
    if (newSelected.length > this.props.max) return;
    if (!newSelected) newSelected = [];
    this.setState({selected: newSelected});
    this.props.onChange(newSelected.length, () => this.prepareCallback());
  }

  getPhotos = () => {
    const params = {
      first: this.props.loadCount || 50,
      assetType: 'Photos',
      sortBy: ['creationTime']
    };
    if (this.state.after) params.after = this.state.after;
    if (!this.state.hasNextPage) return;
    MediaLibrary
      .getAssetsAsync(params)
      .then(this.processPhotos)
  }

  processPhotos = (data) => {
    if (data.totalCount) {
      if (this.state.after === data.endCursor) return;
      const uris = data.assets;
      this.setState({
        photos: [...this.state.photos, ...uris],
        after: data.endCursor,
        hasNextPage: data.hasNextPage
      });
    } else {
      this.setState({isEmpty: true});
    }
  }

  getItemLayout = (data, index) => {
    const length = width / 4;
    return {length, offset: length * index, index}
  }

  prepareCallback() {
    const { selected, photos } = this.state;
    const selectedPhotos = selected.map(i => photos[i]);
    const assetsInfo = Promise.all(selectedPhotos.map(i => MediaLibrary.getAssetInfoAsync(i)));
    this.props.callback(assetsInfo);
  }

  renderImageTile = ({item, index}) => {
    const selected = this.state.selected.indexOf(index) !== -1;
    const selectedItemCount = this.state.selected.indexOf(index) + 1;
    return (
      <ImageTile
        selectedItemCount={selectedItemCount}
        item={item}
        index={index}
        selected={selected}
        selectImage={this.selectImage}
      />
    )
  }

  renderPreloader = () => {
    return this.props.preloaderComponent || <ActivityIndicator size="large"/>
  }

  renderEmptyStay = () => {
    return this.props.emptyStayComponent || <Text style={{textAlign: 'center'}}>Empty =(</Text>
  }

  renderImages() {
    return (
      <FlatList
        data={this.state.photos}
        numColumns={4}
        renderItem={this.renderImageTile}
        keyExtractor={(_, index) => index}
        onEndReached={() => {this.getPhotos()}}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={this.state.isEmpty ? this.renderEmptyStay() : this.renderPreloader()}
        initialNumToRender={24}
        getItemLayout={this.getItemLayout}
      />
    )
  }

  render() {
    return (
      <View style={styles.container}>
        {this.renderImages()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
  },
})
