import React, { Component, Fragment } from 'react';
import axios from 'axios';
import UIkit from 'uikit';
import "../../helpers/iframeLoader.js";
import DOMHelper from '../../helpers/dom-helper';
import EditorText from '../editor-text/editor-text';
import Spinner from '../spinner';

export default class Editor extends Component {
  constructor() {
    super();
    this.currentPage = "index.html";

    this.state = {
      pageList: [],
      newPageName: '',
      loading: true
    }
    this.createNewPage = this.createNewPage.bind(this);
    this.isLoading = this.isLoading.bind(this);
    this.isLoaded = this.isLoaded.bind(this);
  }

  componentDidMount() {
    this.init(this.currentPage);
  }

  init(page) {
    this.iframe = document.querySelector("iframe");
    this.open(page, this.isLoaded);
    this.loadPageList();
  }

  open(page, calbackLoad) {
    // Записываем ту страницу, которую нужно открыть и сбрасываем кеширование
    this.currentPage = page;

    axios.get(`../../../${page}?rnd=${Math.random()}`)
      // С сервера получили строку и парсим её в DOM структуру
      .then(res => DOMHelper.parseStrToDOM(res.data))
      // Оборачиваем все текстовые узлы. тут чистая копия 
      .then(DOMHelper.wrapTextNodes)
      // Сохраняем чистую копию в виртуальный DOM
      .then(dom => {
        this.virtualDom = dom;
        return dom;
      })
      // Для отправки на сервер преобразуем DOM в строку
      .then(DOMHelper.serializeDOMToString)
      .then(html => axios.post("../../../api/saveTempPage.php", { html }))
      .then(() => this.iframe.load("../../../temp.html"))
      // Включаем редактирование элементов
      .then(() => this.enableEditing())
      // Стили при редактировании
      .then(() => this.injectStyles())
      .then(calbackLoad);
  }

  save(onSuccess, onError) {
    this.isLoading();
    const newDom = this.virtualDom.cloneNode(this.virtualDom);
    DOMHelper.unwrapTextNodes(newDom);
    const html = DOMHelper.serializeDOMToString(newDom);
    console.log('[html] ', html);
    axios
      .post("../../../api/savePage.php", { pageName: this.currentPage, html })
      .then(onSuccess)
      .catch(onError)
      .finally(this.isLoaded);
  }

  // Редактирование
  enableEditing() {
    this.iframe.contentDocument.body.querySelectorAll('text-editor').forEach(element => {
      const id = element.getAttribute("nodeid");
      const virtualElement = this.virtualDom.body.querySelector(`[nodeid="${id}"]`);

      new EditorText(element, virtualElement);
    });
    console.log('[enableEditing][virtualDom] ', this.virtualDom);
  }

  injectStyles() {
    const style = this.iframe.contentDocument.createElement("style");
    style.innerHTML = `
    text-editor:hover {
      outline: 3px solid orange;
      outline-offset: 8px;
    }
    text-editor:focus {
      outline: 3px solid red;
      outline-offset: 8px;
    }`;
    this.iframe.contentDocument.head.appendChild(style);
  }

  // Загрузка страниц из API
  loadPageList() {
    axios.get("../../../api")
      .then(res => this.setState({ pageList: res.data }))
  }

  // Создание новой страницы
  createNewPage() {
    axios
      .post("../../../api/createNewPage.php", { "name": this.state.newPageName })
      .then(this.loadPageList())
      .catch(() => alert("Страница уже существует!"))
  }

  // Удаление страницы
  deletePage(page) {
    axios
      .post("../../../api/deletePage.php", { "name": page })
      .then(this.loadPageList())
      .catch(() => alert("Страницы не существует!"))
  }

  isLoading() {
    this.setState({
      loading: true
    })
  }

  isLoaded() {
    this.setState({
      loading: false
    })
  }


  render() {
    const { loading } = this.state;
    const modal = true;
    let spinner;

    loading ? spinner = <Spinner active /> : spinner = <Spinner />
    // const { pageList } = this.state;
    // console.log("pageList ", pageList);
    // const pages = pageList.map((page, index) => {
    //   return (
    //     <h1 key={index}>
    //       {page}
    //       <a
    //         href="#"
    //         onClick={() => this.deletePage(page)}
    //       >
    //         (x)
    //       </a>
    //     </h1>
    //   )
    // })

    return (
      <Fragment>
        <iframe src={this.currentPage} frameBorder="0"></iframe>

        {spinner}

        <div className="panel">
          <button className="uk-button uk-button-primary" uk-toggle="target: #modal-save">Опубликовать</button>
        </div>

        <div id="modal-save" uk-modal={modal.toString()}>
          <div className="uk-modal-dialog uk-modal-body">
            <h2 className="uk-modal-title">Сохранение</h2>
            <p>Вы действительно хотите сохранить изменения?</p>
            <p className="uk-text-right">
              <button className="uk-button uk-button-default uk-modal-close" type="button">Отменить</button>
              <button
                className="uk-button uk-button-primary uk-modal-close"
                type="button"
                onClick={() => this.save(() => {
                  UIkit.notification({ message: 'Успешно сохранено', status: 'success' })
                },
                  () => {
                    UIkit.notification({ message: 'Ошибка сохранения', status: 'danger' })
                  }
                )}
              >Опубликовать</button>
            </p>
          </div>
        </div>
      </Fragment>


      // <Fragment>
      //   <input
      //     onChange={(e) => { this.setState({ newPageName: e.target.value }) }}
      //     type="text" />
      //   <button onClick={this.createNewPage}>Создать страницу</button>
      //   <h1>Заголовки страниц:</h1>
      //   {pages}
      // </Fragment>
    )
  }
}


