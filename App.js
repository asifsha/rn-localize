import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
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
      addText: "Add",
      updateText: "Update",
      yesText: "Yes",
      noText: "No",
      confirmDialogtext: "Are you sure you want to delete this?",
      undoText: "Undo",
      itemDeletedSuccessfullyText: "Item deleted successfully.",
      dataFromFireBaseText: "Data from Firebase",
      typeSomethingText: "Type Something",
      confirmText: "Confirm",
      selectLanguageText: "Select Language",
      lastLanguageCode: "en",
      isLoading: false
    };
  }
  componentDidMount() {
    // start listening for firebase updates
    this.listenForTasks(this.tasksRef, "", "");
    this.loadLanguages();
  }

  async loadLanguages() {
    
    const languages = ISO6391.getLanguages(languageCode.codes);
    this.setState({ languages: languages });
    
  }

  listenForTasks(tasksRef, sourceLang, targetLang) {
    tasksRef.on("value", dataSnapshot => {
      this.setState({ dataSource: [], isLoading: true });
     
    
      const oldItems = [];
      
      let dbsnap = [];
      dataSnapshot.forEach(child => {
        dbsnap.push({ key: child.key, value: child.val().name });
      });

      

      this.asyncTranslate(dbsnap, oldItems, sourceLang, targetLang).then(() => {
       
        this.setState({
          dataSource: oldItems,
          isLoading: false
        });
      });
    });
  }

  asyncTranslate = async (dataSnapshot, oldItems, sourceLang, targetLang) => {
    for (const child of dataSnapshot) {
      const result = await this.translate(child.value, sourceLang, targetLang);

      oldItems.push({
        name: result,
        key: child.key
      });
    }    
  };

 

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
    this.setState({
      dataSource: []
    });

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

    firebaseApp
      .database()
      .ref()
      .update(updates);

    return;
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
    this.setState({ isLoading: true });
    const { onDropdownClose } = this.props;
    onDropdownClose();
    
    const lastCode = this.state.lastLanguageCode;
    this.translate(this.state.yesText, lastCode, item.code).then(res =>
      this.setState({ yesText: res })
    );
    this.translate(this.state.noText, lastCode, item.code).then(res =>
      this.setState({ noText: res })
    );
    this.translate(this.state.addText, lastCode, item.code).then(res =>
      this.setState({ addText: res })
    );
    this.translate(this.state.updateText, lastCode, item.code).then(res =>
      this.setState({ updateText: res })
    );
    this.translate(this.state.typeSomethingText, lastCode, item.code).then(
      res => this.setState({ typeSomethingText: res })
    );
    this.translate(this.state.confirmDialogtext, lastCode, item.code).then(
      res => this.setState({ confirmDialogtext: res })
    );

    this.translate(this.state.undoText, lastCode, item.code).then(res =>
      this.setState({ undoText: res })
    );
    this.translate(
      this.state.itemDeletedSuccessfullyText,
      lastCode,
      item.code
    ).then(res => this.setState({ itemDeletedSuccessfullyText: res }));
    this.translate(this.state.dataFromFireBaseText, lastCode, item.code).then(
      res => this.setState({ dataFromFireBaseText: res })
    );
    this.translate(this.state.confirmText, lastCode, item.code).then(res =>
      this.setState({ confirmText: res })
    );
    this.translate(this.state.selectLanguageText, lastCode, item.code).then(
      res => this.setState({ selectLanguageText: res })
    );
    this.listenForTasks(this.tasksRef, lastCode, item.code);
    this.setState({ lastLanguageCode: item.code });
    //this.setState({ isLoading: false });
    
  }
  translate2(text, sourceCode, targetCode) {
    return new Promise((resolve, reject) => {
      setTimeout(function() {
        resolve(text + "foo");
      }, 1000);
    });
  }

  translate(text, sourceCode, targetCode) {
    let url = `https://api.mymemory.translated.net/get?q=${text}&langpair=${sourceCode}|${targetCode}`;

    return new Promise((resolve, reject) => {
      if (sourceCode === "" || targetCode === "") {
        resolve(text);
        return;
      }
      fetch(url, {
        method: "GET"
      })
        .then(response => response.json())
        .then(function(data) {
          
          resolve(data.matches[0].translation);
        })
        .catch(function(error) {
          console.error("Error:", error);
          reject(error);
        });
    });
  }

  render() {   
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
                valueExtractor={item => item.name + " " + item.nativeName}
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
              {this.state.selecteditem === null
                ? this.state.addText
                : this.state.updateText}
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
            {this.state.isLoading && (
              <ActivityIndicator size="large" color="#0000ff" />
            )}

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
                  <Button onPress={() => this.hideDialog(true)}>
                    {this.state.yesText}
                  </Button>
                  <Button onPress={() => this.hideDialog(false)}>
                    {this.state.noText}
                  </Button>
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
