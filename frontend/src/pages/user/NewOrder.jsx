import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Añadir useLocation
import { FiArrowLeft, FiPlus, FiTrash2, FiAlertCircle, FiShoppingCart, FiCalendar } from "react-icons/fi";
import ProductService from "../../services/ProductService";
import PresentationProductService from "../../services/PresentationProductService";
import OrderService from "../../services/OrderService";
import BranchService from "../../services/BranchService";
import templateService from "../../services/TemplateService"; // Importar servicio de plantillas
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ProductSelector from "../../components/user/orders/ProductSelector";
import OrderSummary from "../../components/user/orders/OrderSummary";
import { useAuth } from "../../context/AuthContext"; // Asegúrate de importar el contexto de autenticación

export default function NewOrder() {
  const navigate = useNavigate();
  const location = useLocation(); // Para obtener los parámetros de la URL
  const { auth } = useAuth();
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [observations, setObservations] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  // Agregar estado para la fecha del pedido
  const [orderDate, setOrderDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [templateLoaded, setTemplateLoaded] = useState(false); // Para controlar si ya se cargó una plantilla

  useEffect(() => {
    // Eliminar la verificación de roles ya que todos los usuarios pueden crear pedidos
    fetchInitialData();
    
    // Establecer la fecha actual como valor predeterminado
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setOrderDate(formattedDate);
  }, [auth]);

  // Nuevo useEffect para cargar la plantilla si se proporciona en la URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const templateId = queryParams.get('template');
    
    if (templateId && !templateLoaded && products.length > 0) {
      loadTemplateProducts(templateId);
    }
  }, [location.search, templateLoaded, products]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Modificar para cargar solo los productos y las sucursales del usuario actual
      const [productsResponse, branchesResponse] = await Promise.all([
        ProductService.getAllProducts(),
        BranchService.getMyBranches() // Cambiar a un método que obtenga solo las sucursales del usuario
      ]);

      if (productsResponse.success) {
        setProducts(productsResponse.data);
      } else {
        setError("No se pudieron cargar los productos");
      }

      if (branchesResponse.success) {
        setBranches(branchesResponse.data);
      } else {
        setError("No se pudieron cargar las sucursales");
      }
    } catch (err) {
      console.error("Error al cargar datos iniciales:", err);
      setError(err.message || "Error al cargar datos iniciales");
    } finally {
      setIsLoading(false);
    }
  };

  // Nueva función para cargar los productos de una plantilla
  const loadTemplateProducts = async (templateId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Obtener la plantilla por su ID
      const template = await templateService.getTemplateById(templateId);
      
      if (!template || !template.productos || !Array.isArray(template.productos)) {
        throw new Error("No se pudo cargar la plantilla o no contiene productos");
      }
      
      // Procesar cada producto de la plantilla
      const templateItems = [];
      
      for (const item of template.productos) {
        // Buscar el producto en la lista de productos cargados
        const productDetails = products.find(p => p.id === parseInt(item.producto_id));
        
        if (!productDetails) {
          console.warn(`Producto con ID ${item.producto_id} no encontrado`);
          continue;
        }
        
        // Obtener las presentaciones del producto
        const presentationsResponse = await PresentationProductService.getProductPresentations(item.producto_id);
        
        let presentationDetails = null;
        
        // Manejar diferentes formatos de respuesta
        if (Array.isArray(presentationsResponse)) {
          presentationDetails = presentationsResponse.find(
            p => (p.id === parseInt(item.presentacion_id) || p.presentacion_id === parseInt(item.presentacion_id))
          );
        } else if (presentationsResponse && Array.isArray(presentationsResponse.data)) {
          presentationDetails = presentationsResponse.data.find(
            p => (p.id === parseInt(item.presentacion_id) || p.presentacion_id === parseInt(item.presentacion_id))
          );
        }
        
        if (!presentationDetails) {
          console.warn(`Presentación con ID ${item.presentacion_id} no encontrada para el producto ${item.producto_id}`);
          continue;
        }
        
        // Crear el item para el pedido
        templateItems.push({
          producto_id: parseInt(item.producto_id),
          producto_nombre: productDetails.nombre,
          producto_codigo: productDetails.codigo,
          presentacion_id: parseInt(item.presentacion_id),
          presentacion_nombre: presentationDetails.presentacion_nombre || presentationDetails.nombre,
          cantidad_por_presentacion: presentationDetails.cantidad,
          cantidad: parseInt(item.cantidad),
          unidad_base: productDetails.unidad_nombre
        });
      }
      
      // Actualizar el estado con los productos de la plantilla
      setOrderItems(templateItems);
      setTemplateLoaded(true);
      
    } catch (error) {
      console.error("Error al cargar productos de la plantilla:", error);
      setError("No se pudieron cargar los productos de la plantilla");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (productId, presentationId, quantity) => {
    try {
      // Verificar si ya existe este producto con esta presentación
      const existingItemIndex = orderItems.findIndex(
        item => item.producto_id === productId && item.presentacion_id === presentationId
      );

      if (existingItemIndex >= 0) {
        // Actualizar cantidad si ya existe
        const updatedItems = [...orderItems];
        updatedItems[existingItemIndex].cantidad += quantity;
        setOrderItems(updatedItems);
        return; // Salir de la función después de actualizar
      }

      // Obtener detalles del producto
      const productDetails = products.find(p => p.id === productId);
      if (!productDetails) {
        console.error("Producto no encontrado:", productId);
        return;
      }
      
      // Obtener presentaciones del producto
      const presentationsResponse = await PresentationProductService.getProductPresentations(productId);
      
      let presentationDetails = null;
      
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(presentationsResponse)) {
        presentationDetails = presentationsResponse.find(
          p => (p.id === presentationId || p.presentacion_id === presentationId)
        );
      } else if (presentationsResponse && Array.isArray(presentationsResponse.data)) {
        presentationDetails = presentationsResponse.data.find(
          p => (p.id === presentationId || p.presentacion_id === presentationId)
        );
      }
      
      if (!presentationDetails) {
        console.error("Presentación no encontrada:", { 
          presentationId, 
          response: presentationsResponse 
        });
        return;
      }
      
      // Crear nuevo item con los datos correctos
      const newItem = {
        producto_id: productId,
        producto_nombre: productDetails.nombre,
        producto_codigo: productDetails.codigo,
        presentacion_id: presentationId,
        presentacion_nombre: presentationDetails.presentacion_nombre || presentationDetails.nombre,
        cantidad_por_presentacion: presentationDetails.cantidad,
        cantidad: quantity,
        unidad_base: productDetails.unidad_nombre
      };
      
      setOrderItems([...orderItems, newItem]);
      
    } catch (err) {
      console.error("Error al agregar producto:", err);
      setError(err.message || "Error al agregar producto");
    }
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...orderItems];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) return;
    
    const updatedItems = [...orderItems];
    updatedItems[index].cantidad = newQuantity;
    setOrderItems(updatedItems);
  };

  const handleQuantityInputChange = (index, value) => {
    // Permitir que el usuario escriba, pero validar que sea un número entero positivo
    const numValue = parseInt(value, 10);
    
    // Si está vacío, dejar que lo escriba (para permitir borrar y escribir de nuevo)
    if (value === '') {
      const updatedItems = [...orderItems];
      updatedItems[index].cantidad = '';
      setOrderItems(updatedItems);
      return;
    }
    
    // Validar que sea un número entero válido
    if (!isNaN(numValue) && numValue > 0) {
      const updatedItems = [...orderItems];
      updatedItems[index].cantidad = numValue;
      setOrderItems(updatedItems);
    }
    // Si no es válido, simplemente no actualizar
  };

  const handleQuantityInputBlur = (index) => {
    const updatedItems = [...orderItems];
    
    // Si el campo está vacío o es inválido al perder el foco, restaurar el valor anterior    
    if (!updatedItems[index].cantidad || updatedItems[index].cantidad === '') {
      updatedItems[index].cantidad = 1;
      setOrderItems(updatedItems);
    }
  };

  const handleSubmitOrder = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (orderItems.length === 0) {
        setError("Debe agregar al menos un producto al pedido");
        setIsSubmitting(false);
        return;
      }
      
      // Validar que se haya seleccionado una fecha
      if (!orderDate) {
        setError("Debe seleccionar una fecha para el pedido");
        setIsSubmitting(false);
        return;
      }

      // Preparar datos del pedido
      const orderData = {
        fecha: orderDate, // Usar la fecha seleccionada
        sucursal_id: selectedBranch || null,
        observaciones: observations || null,
        productos: orderItems.map(item => ({
          producto_id: item.producto_id,
          presentacion_id: item.presentacion_id,
          cantidad: item.cantidad
        }))
      };

      // Enviar pedido
      const response = await OrderService.createOrder(orderData);

      if (response.success) {
        navigate("/user/orders", { 
          state: { message: "Pedido creado exitosamente" } 
        });
      } else {
        setError(response.message || "Error al crear el pedido");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Error al enviar pedido:", err);
      setError(err.message || "Error al enviar el pedido");
      setIsSubmitting(false);
    }
  };

  const goToConfirmation = () => {
    if (orderItems.length === 0) {
      setError("Debe agregar al menos un producto al pedido");
      return;
    }
    setError(null);
    setStep(2);
  };

  const goBackToSelection = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white p-4 flex items-center shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-4 text-gray-600"
          aria-label="Volver"
        >
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">
          {step === 1 ? "Nuevo Pedido" : "Confirmar Pedido"}
        </h1>
      </header>

      <main className="container mx-auto px-4 py-4">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 flex items-center">
            <FiAlertCircle className="mr-2" />
            <span>{error}</span>
          </div>
        ) : step === 1 ? (
          <>
            {/* Paso 1: Selección de productos */}
            <div className="bg-white rounded-lg shadow mb-4 p-4">
              <h2 className="font-semibold mb-3">Información del pedido</h2>
              
              {/* Selector de fecha */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiCalendar className="inline mr-1" />
                  Fecha del pedido
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sucursal (opcional)
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Seleccionar sucursal</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  rows="2"
                  placeholder="Instrucciones especiales para el pedido"
                ></textarea>
              </div>
            </div>
            
            {/* Selector de productos */}
            <ProductSelector 
              products={products}
              onAddProduct={handleAddProduct}
            />
            
            {/* Lista de productos seleccionados */}
            {orderItems.length > 0 && (
              <div className="bg-white rounded-lg shadow mt-4">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-semibold">Productos seleccionados</h2>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {orderItems.map((item, index) => (
                    <div key={`${item.producto_id}-${item.presentacion_id}`} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{item.producto_nombre}</h3>
                          <p className="text-sm text-gray-500">Código: {item.producto_codigo}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 p-1 hover:bg-red-50 rounded-full"
                          aria-label="Eliminar"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-sm">
                            {item.presentacion_nombre} 
                            <span className="text-gray-500 ml-1">
                              ({item.cantidad_por_presentacion} {item.unidad_base})
                            </span>
                          </p>
                        </div>
                        
                        <div className="flex items-center">
                          <button
                            onClick={() => handleUpdateQuantity(index, item.cantidad - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-l-md"
                            disabled={item.cantidad <= 1}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.cantidad}
                            onChange={(e) => handleQuantityInputChange(index, e.target.value)}
                            onBlur={() => handleQuantityInputBlur(index)}
                            className="w-12 text-center border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            min="1"
                          />
                          <button
                            onClick={() => handleUpdateQuantity(index, item.cantidad + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-r-md"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Botón para continuar */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={goToConfirmation}
                disabled={orderItems.length === 0}
                className={`flex items-center px-4 py-2 rounded-md ${
                  orderItems.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-500 text-white hover:bg-green-600"
                } transition-colors`}
              >
                <FiShoppingCart className="mr-2" />
                Revisar pedido
              </button>
            </div>
          </>
        ) : (
          <OrderSummary 
            orderItems={orderItems}
            selectedBranch={branches.find(b => b.id === parseInt(selectedBranch))}
            observations={observations}
            orderDate={orderDate} // Pasar la fecha al componente OrderSummary
            onGoBack={goBackToSelection}
            onSubmit={handleSubmitOrder}
            isSubmitting={isSubmitting}
          />
        )}
      </main>
    </div>
  );
}