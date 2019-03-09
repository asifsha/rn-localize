import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableWithoutFeedback,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from "react-native";
import * as firebaseApp from "firebase";
import {
  TextInput,
  Button,
  Snackbar,
  Portal,
  Dialog,
  Paragraph,
  Provider as PaperProvider
} from "react-native-paper";
import * as firebaseconfig from "./firebase.config";
import * as translateConfig from "./translate.config";

import * as languageCode from "./languageCode";

import { Platform } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import ISO6391 from "iso-639-1";

import shortid from "shortid";

import {
  Autocomplete,
  withKeyboardAwareScrollView
} from "react-native-dropdown-autocomplete";

import { PowerTranslator, ProviderTypes, TranslatorConfiguration, TranslatorFactory } from 'react-native-power-translator';



class App extends React.Component {

  
  constructor(props) {
    super(props);

    if (!firebaseApp.apps.length) {
      firebaseApp.initializeApp(firebaseconfig.Config);
    }
    this.tasksRef = firebaseApp.database().ref("/items");

    const dataSource = [];
    this.state = {
      dataSource: dataSource,
      selecteditem: null,
      snackbarVisible: false,
      confirmVisible: false,
      languages: [],      
      addtext:'Add',
      updatetext:'Update',
      yesText:'Yes',
      noText:'No',
      confirmDialogtext : 'Are you sure you want to delete this?',
      undoText:'Undo',
      itemDeletedSuccessfullyText:'Item deleted successfully.',
      dataFromFireBaseText:'Data from Firebase',
      typeSomethingText:'Type Something',
      confirmText:'Confirm',
      selectLanguageText:'Select Language'
    };
  }
  componentDidMount() {
    TranslatorConfiguration.setConfig(ProviderTypes.Google, translateConfig.Config.key,'fr');
    // start listening for firebase updates
    this.listenForTasks(this.tasksRef);
    this.loadLanguages();
    
  }

  async loadLanguages() {
   
    console.log("Languages:");
    const languages=ISO6391.getLanguages(languageCode.codes);
    this.setState({languages : languages })
    console.log(languages);
  }

  listenForTasks(tasksRef) {
    tasksRef.on("value", dataSnapshot => {
      var tasks = [];
      dataSnapshot.forEach(child => {
        tasks.push({
          name: child.val().name,
          key: child.key
        });
      });

      this.setState({
        dataSource: tasks
      });
    });
  }

  renderSeparator = () => {
    return (
      <View
        style={{
          width: "90%",
          height: 2,
          backgroundColor: "#BBB5B3"
        }}
      >
        <View />
      </View>
    );
  };

  deleteItem(item) {
    this.setState({ deleteItem: item, confirmVisible: true });
  }

  performDeleteItem(key) {
    var updates = {};
    updates["/items/" + key] = null;
    return firebaseApp
      .database()
      .ref()
      .update(updates);
  }

  addItem(itemName) {
    var newPostKey = firebaseApp
      .database()
      .ref()
      .child("items")
      .push().key;

    var updates = {};
    updates["/items/" + newPostKey] = {
      name:
        itemName === "" || itemName == undefined
          ? this.state.itemname
          : itemName
    };

    return firebaseApp
      .database()
      .ref()
      .update(updates);
  }

  updateItem() {
    var updates = {};
    updates["/items/" + this.state.selecteditem.key] = {
      name: this.state.itemname
    };

    return firebaseApp
      .database()
      .ref()
      .update(updates);
  }

  saveItem() {
    if (this.state.selecteditem === null) this.addItem();
    else this.updateItem();

    this.setState({ itemname: "", selecteditem: null });
  }

  hideDialog(yesNo) {
    this.setState({ confirmVisible: false });
    if (yesNo === true) {
      this.performDeleteItem(this.state.deleteItem.key).then(() => {
        this.setState({ snackbarVisible: true });
      });
    }
  }
  

  showDialog() {
    this.setState({ confirmVisible: true });
    
  }

  undoDeleteItem() {
    this.addItem(this.state.deleteItem.name);
  }

  handleSelectItem(item, index) {
    const { onDropdownClose } = this.props;
    onDropdownClose();
    console.log(item);
    TranslatorConfiguration.setConfig(ProviderTypes.Google, translateConfig.Config.key,item.code);
    const translator = TranslatorFactory.createTranslator();
    translator.translate('Engineering physics or engineering science').then(translated => {
      //Do something with the translated text
      setState({itemtext: translated});
  });

  }

  render() {
    const autocompletes = [...Array(10).keys()];
    const data = [
      "Apples",
      "Broccoli",
      "Chicken",
      "Duck",
      "Eggs",
      "Fish",
      "Granola",
      "Hash Browns",
      "Apples1",
      "Apples2",
      "Apples3"
    ];
    //const { query } = this.state.query;
    //data = this._filterData(query)
    const { scrollToInput, onDropdownClose, onDropdownShow } = this.props;
    return (
      <PaperProvider>
        <View style={styles.container}>
          <View style={styles.autocompletesContainer}>
            <SafeAreaView>
              <Autocomplete
                key={shortid.generate()}
                style={styles.input}
                scrollToInput={ev => scrollToInput(ev)}
                handleSelectItem={(item, id) => this.handleSelectItem(item, id)}
                onDropdownClose={() => onDropdownClose()}
                onDropdownShow={() => onDropdownShow()}
                renderIcon={() => <View />}
                data={this.state.languages}                
                minimumCharactersCount={2}
                highlightText
                valueExtractor={item => item.name + ' ' + item.nativeName}
                rightContent
                rightTextExtractor={item => item.code}
                placeholder={this.state.selectLanguageText}
              />
            </SafeAreaView>
          </View>
          <View />

          <ScrollView>
            <Text>{this.state.dataFromFireBaseText}</Text>
            <TextInput
              label={this.state.typeSomethingText}
              style={{
                height: 50,
                width: 250,
                borderColor: "gray",
                borderWidth: 1
              }}
              onChangeText={text => this.setState({ itemname: text })}
              value={this.state.itemname}
            />
            <View style={{ height: 10 }} />
            <Button
              icon={this.state.selecteditem === null ? "add" : "update"}
              mode="contained"
              onPress={() => this.saveItem()}
            >
              {this.state.selecteditem === null ? this.state.addtext : this.state.updatetext}
            </Button>
            <FlatList
              data={this.state.dataSource}
              renderItem={({ item }) => (
                <View>
                  <ScrollView horizontal={true}>
                    <TouchableWithoutFeedback>
                      <View style={{ paddingTop: 10 }}>
                        <Text
                          style={{ color: "#4B0082" }}
                          onPress={() => this.deleteItem(item)}
                        >
                          <Ionicons name="md-trash" size={20} />
                        </Text>
                      </View>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback
                      onPress={() =>
                        this.setState({
                          selecteditem: item,
                          itemname: item.name
                        })
                      }
                    >
                      <View>
                        <Text style={styles.item}>{item.name} </Text>
                      </View>
                    </TouchableWithoutFeedback>
                  </ScrollView>
                </View>
              )}
              ItemSeparatorComponent={this.renderSeparator}
            />
            <Text />

            <Portal>
              <Dialog
                visible={this.state.confirmVisible}
                onDismiss={() => this.hideDialog(false)}
              >
                <Dialog.Title>{this.state.confirmText}</Dialog.Title>
                <Dialog.Content>
                  <Paragraph>{this.state.confirmDialogtext}</Paragraph>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => this.hideDialog(true)}>{this.state.yesText}</Button>
                  <Button onPress={() => this.hideDialog(false)}>{this.state.noText}</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </ScrollView>
          <Snackbar
            visible={this.state.snackbarVisible}
            onDismiss={() => this.setState({ snackbarVisible: false })}
            action={{
              label: this.state.undoText,
              onPress: () => {
                // Do something
                this.undoDeleteItem();
              }
            }}
          >
            {this.state.itemDeletedSuccessfullyText}
          </Snackbar>
        </View>
      </PaperProvider>
    );
  }
}

export default withKeyboardAwareScrollView(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 38 : 22,
    alignItems: "center",
    backgroundColor: "#F5FFFA"
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
    alignItems: "center"
  },
  autocompletesContainer: {
    paddingTop: 0,
    zIndex: 1,
    width: "100%",
    paddingHorizontal: 8
  },
  input: { maxHeight: 40 },
  inputContainer: {
    display: "flex",
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#c7c6c1",
    paddingVertical: 13,
    paddingLeft: 12,
    paddingRight: "5%",
    width: "100%",
    justifyContent: "flex-start"
  },
  // container: {
  //   flex: 1,
  //   backgroundColor: "#ffffff",
  // },
  plus: {
    position: "absolute",
    left: 15,
    top: 10
  }
});
