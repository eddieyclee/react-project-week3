import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal } from 'bootstrap';

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;
const defaultModalState = {
  imageUrl: "",
  title: "",
  category: "",
  unit: "",
  origin_price: "",
  price: "",
  description: "",
  content: "",
  is_enabled: 0,
  imagesUrl: [""]
};

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [tempProduct, setTempProduct] = useState(defaultModalState);
  const [products, setProducts] = useState([]);
  const [account, setAccount] = useState(
    {
      username: "example@test.com",
      password: "example"
    }
  )

  // 登入畫面Input內容，處理帳號與密碼
  const handleInput = (e) => {
    const {name, value} = e.target;
    setAccount({
      ...account,
      [name]: value
    })
  }

  // 取得產品資料
  const getProducts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/${API_PATH}/admin/products`);
      // 讀取資料庫產品資料，並進行更新
      setProducts(res.data.products);
    } catch (error) {
      alert("取得產品失敗");
    }
  }

  // 登入按鈕事件
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 透過axios連線API
      const res = await axios.post(`${BASE_URL}/admin/signin`, account);

      // 取得token, expired
      const { token, expired } = res.data;

      // 由cookie內暫存token與到期時間
      document.cookie = `hexToken=${token}; expires=${new Date(expired)};`;

      // 進行驗證token
      axios.defaults.headers.common['Authorization'] = token;

      // 取得產品列表
      getProducts();

      // 驗證通過顯示產品列表
      setIsAuth(true);
    } catch (error) {
      alert("登入失敗");
    }
  }

  // 驗證是否已登入
  const checkUserLogin = async () => {
    try {
      await axios.post(`${BASE_URL}/api/user/check`);
      getProducts();
      setIsAuth(true);
    } catch (error) {
      alert(error);
    }
  }

  useEffect(() => {
    // 取得驗證token
    const token = document.cookie.replace(/(?:(?:^|.*;\s*)hexToken\s*=\s*([^;]*).*$)|^.*$/, "$1");

    if (!token) {
      return;
    } else {
      // 進行驗證token
      axios.defaults.headers.common['Authorization'] = token;
      checkUserLogin();
    }

  }, [])

  // 取得productModal DOM元素
  const productModalRef = useRef(null);
  // delProductModal DOM元素
  const delProductModalRef = useRef(null);
  const productModalMethodRef = useRef(null);
  const delProductModalMethodRef = useRef(null);
  const [modalMode, setModalMode] = useState(null);

  useEffect(() => {
    // productModalMethodRef.current 存放Modal的變數
    productModalMethodRef.current = new Modal(productModalRef.current, {backdrop: false});
    productModalRef.current.addEventListener('hide.bs.modal', () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });

    // delProductModalRef.current 存放Modal的變數
    delProductModalMethodRef.current = new Modal(delProductModalRef.current, {backdrop: false});
    delProductModalRef.current.addEventListener('hide.bs.modal', () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
  }, [])

  // 開啟ProductModal事件
  const handleOpenProductModal = (mode, product) => {
    // 設定新增或編輯Modal
    setModalMode(mode);

    if (mode === 'create') {
      // 全新ProductModal
      setTempProduct(defaultModalState);
    } else {
      // 原ProductModal
      setTempProduct(product);
    }

    productModalMethodRef.current.show();
  }

  // 關閉ProductModal事件
  const handleCloseProductModal = () => {
    productModalMethodRef.current.hide();
  }

  // 開啟DelProductModal事件
  const handleDelOpenProductModal = (product) => {
    setTempProduct(product);
    delProductModalMethodRef.current.show();
  }

  // 關閉DelProductModal事件
  const handleDelCloseProductModal = () => {
    delProductModalMethodRef.current.hide();
  }

  // Input為checkbox 帶入checked值
  const handleInputModalChange = (e) => {
    const { name, value, checked, type } = e.target;
    setTempProduct({
      ...tempProduct,
      [name]: type === "checkbox" ? checked : value
    })
  }

  // 圖片路徑變更事件
  const handleImageChange = (e, index) => {
    const { value } = e.target;
    const newImages = [...tempProduct.imagesUrl];
    newImages[index] = value;

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages
    })
  }

  // 新增圖片事件
  const handleAddImage = () => {
    const newImages = [...tempProduct.imagesUrl, ''];
    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages
    })
  }

  // 刪除圖片事件
  const handleRemoveImage = () => {
    const newImages = [...tempProduct.imagesUrl];
    newImages.pop();
    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages
    })
  }

  // 新增產品
  const creatProduct = async () => {
    try {
      await axios.post(`${BASE_URL}/api/${API_PATH}/admin/product`, {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0
        }
      });
    } catch (error) {
      alert('新增產品失敗');
    }
  }

  // 編輯產品
  const updateProduct = async () => {
    try {
      await axios.put(`${BASE_URL}/api/${API_PATH}/admin/product/${tempProduct.id}`, {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0
        }
      });
    } catch (error) {
      alert('新增產品失敗');
    }
  }

  // 更新產品事件
  const handleUpdateProduct = async () => {
    const apiCall = modalMode === 'create' ? creatProduct : updateProduct;
    try {
      await apiCall();
      getProducts();
      handleCloseProductModal();
    } catch (error) {
      alert('更新產品失敗');
    }
  }

  // 刪除產品
  const deleteProduct = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/${API_PATH}/admin/product/${tempProduct.id}`);
    } catch (error) {
      alert('刪除產品失敗');
    }
  }

  // 刪除產品事件
  const handleDelProduct = async () => {
    try {
      await deleteProduct();
      getProducts();
      handleDelCloseProductModal();
    } catch (error) {
      alert('刪除產品失敗');
    }
  }

  return (
    <>
    {isAuth ? (
      <div className="container py-5">
        <div className="row">
          <div className="col">
            <div className="d-flex justify-content-between">
            <h2>產品列表</h2>
            <button type="button" className="btn btn-primary" onClick={() => handleOpenProductModal('create')}>建立新的產品</button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">產品名稱</th>
                  <th scope="col">原價</th>
                  <th scope="col">售價</th>
                  <th scope="col">是否啟用</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <th scope="row">{product.title}</th>
                    <td>{product.origin_price}</td>
                    <td>{product.price}</td>
                    <td>{product.is_enabled ? <span className="text-success">啟用</span> : <span>未啟用</span>}</td>
                    <td>
                    <div className="btn-group">
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => handleOpenProductModal('edit', product)}>編輯</button>
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleDelOpenProductModal(product)}>刪除</button>
                    </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      ) : 
      (<div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <h1 className="mb-5">請先登入</h1>
        <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
          <div className="form-floating mb-3">
            <input onChange={handleInput} name="username" value={account.username} type="email" className="form-control" id="username" placeholder="name@example.com" />
            <label htmlFor="username">Email address</label>
          </div>
          <div className="form-floating">
            <input onChange={handleInput} name="password" value={account.password} type="password" className="form-control" id="password" placeholder="Password" />
            <label htmlFor="password">Password</label>
          </div>
          <button className="btn btn-primary">登入</button>
        </form>
        <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
      </div>
      )
    }

    <div ref={productModalRef} id="productModal" className="modal" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-bottom">
            <h5 className="modal-title fs-4">{modalMode === 'create' ? '新增產品' : '編輯產品'}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={handleCloseProductModal}></button>
          </div>

          <div className="modal-body p-4">
            <div className="row g-4">
              <div className="col-md-4">
                <div className="mb-4">
                  <label htmlFor="primary-image" className="form-label">
                    主圖
                  </label>
                  <div className="input-group">
                    <input
                      value={tempProduct.imageUrl}
                      onChange={handleInputModalChange}
                      name="imageUrl"
                      type="text"
                      id="primary-image"
                      className="form-control"
                      placeholder="請輸入圖片連結"
                    />
                  </div>
                  <img
                    src={tempProduct.imageUrl}
                    alt={tempProduct.title}
                    className="img-fluid"
                  />
                </div>

                {/* 副圖 */}
                <div className="border border-2 border-dashed rounded-3 p-3">
                  {tempProduct.imagesUrl?.map((image, index) => (
                    <div key={index} className="mb-2">
                      <label
                        htmlFor={`imagesUrl-${index + 1}`}
                        className="form-label"
                      >
                        副圖 {index + 1}
                      </label>
                      <input
                        value={image}
                        onChange={(e) => handleImageChange(e, index)}
                        id={`imagesUrl-${index + 1}`}
                        type="text"
                        placeholder={`圖片網址 ${index + 1}`}
                        className="form-control mb-2"
                      />
                      {image && (
                        <img
                          src={image}
                          alt={`副圖 ${index + 1}`}
                          className="img-fluid mb-2"
                        />
                      )}
                    </div>
                  ))}
                  <div className="btn-group w-100">
                    {tempProduct.imagesUrl.length < 5 && 
                    tempProduct.imagesUrl[tempProduct.imagesUrl.length - 1] !== '' && 
                    (<button className="btn btn-outline-primary btn-sm w-100" onClick={handleAddImage}>新增圖片</button>)
                    }

                    {tempProduct.imagesUrl.length > 1 && 
                    (<button className="btn btn-outline-danger btn-sm w-100" onClick={handleRemoveImage}>取消圖片</button>)
                    }
                  </div>

                </div>
              </div>

              <div className="col-md-8">
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    標題
                  </label>
                  <input
                    value={tempProduct.title}
                    onChange={handleInputModalChange}
                    name="title"
                    id="title"
                    type="text"
                    className="form-control"
                    placeholder="請輸入標題"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="category" className="form-label">
                    分類
                  </label>
                  <input
                    value={tempProduct.category}
                    onChange={handleInputModalChange}
                    name="category"
                    id="category"
                    type="text"
                    className="form-control"
                    placeholder="請輸入分類"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="unit" className="form-label">
                    單位
                  </label>
                  <input
                    value={tempProduct.unit}
                    onChange={handleInputModalChange}
                    name="unit"
                    id="unit"
                    type="text"
                    className="form-control"
                    placeholder="請輸入單位"
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label htmlFor="origin_price" className="form-label">
                      原價
                    </label>
                    <input
                      value={tempProduct.origin_price}
                      onChange={handleInputModalChange}
                      name="origin_price"
                      id="origin_price"
                      type="number"
                      className="form-control"
                      placeholder="請輸入原價"
                    />
                  </div>
                  <div className="col-6">
                    <label htmlFor="price" className="form-label">
                      售價
                    </label>
                    <input
                      value={tempProduct.price}
                      onChange={handleInputModalChange}
                      name="price"
                      id="price"
                      type="number"
                      className="form-control"
                      placeholder="請輸入售價"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    產品描述
                  </label>
                  <textarea
                    value={tempProduct.description}
                    onChange={handleInputModalChange}
                    name="description"
                    id="description"
                    className="form-control"
                    rows={4}
                    placeholder="請輸入產品描述"
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label htmlFor="content" className="form-label">
                    說明內容
                  </label>
                  <textarea
                    value={tempProduct.content}
                    onChange={handleInputModalChange}
                    name="content"
                    id="content"
                    className="form-control"
                    rows={4}
                    placeholder="請輸入說明內容"
                  ></textarea>
                </div>

                <div className="form-check">
                  <input
                    checked={tempProduct.is_enabled}
                    onChange={handleInputModalChange}
                    name="is_enabled"
                    type="checkbox"
                    className="form-check-input"
                    id="isEnabled"
                  />
                  <label className="form-check-label" htmlFor="isEnabled">
                    是否啟用
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer border-top bg-light">
            <button type="button" className="btn btn-secondary" onClick={handleCloseProductModal}>
              取消
            </button>
            <button type="button" className="btn btn-primary" onClick={handleUpdateProduct}>
              確認
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      ref={delProductModalRef}
      className="modal fade"
      id="delProductModal"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5">刪除產品</h1>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              onClick={handleDelCloseProductModal}
            ></button>
          </div>
          <div className="modal-body">
            你是否要刪除 
            <span className="text-danger fw-bold">{tempProduct.title}</span>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDelCloseProductModal}
            >
              取消
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelProduct}>
              刪除
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default App
