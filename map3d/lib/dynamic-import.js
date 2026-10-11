/**
 * Dynamic Import Wrapper for 3D Components
 * Enables code splitting and prevents SSR issues
 */

export class DynamicLoader {
  static componentCache = new Map();
  static loadingPromises = new Map();
  
  /**
   * Dynamically import a 3D component with caching
   */
  static async loadComponent(componentPath, componentName = 'default') {
    const cacheKey = `${componentPath}#${componentName}`;
    
    // Return cached component if available
    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey);
    }
    
    // Return existing promise if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }
    
    // Create new loading promise
    const loadingPromise = this._importComponent(componentPath, componentName);
    this.loadingPromises.set(cacheKey, loadingPromise);
    
    try {
      const component = await loadingPromise;
      this.componentCache.set(cacheKey, component);
      this.loadingPromises.delete(cacheKey);
      return component;
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      throw error;
    }
  }
  
  static async _importComponent(componentPath, componentName) {
    try {
      const module = await import(componentPath);
      const component = componentName === 'default' ? module.default : module[componentName];
      
      if (!component) {
        throw new Error(`Component '${componentName}' not found in '${componentPath}'`);
      }
      
      return component;
    } catch (error) {
      console.error(`Failed to load component '${componentName}' from '${componentPath}':`, error);
      throw new Error(`Dynamic import failed: ${error.message}`);
    }
  }
  
  /**
   * Create a React component wrapper for dynamic loading
   */
  static createDynamicComponent(componentPath, componentName = 'default', fallbackComponent = null) {
    return function DynamicComponent(props) {
      const [Component, setComponent] = React.useState(null);
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState(null);
      
      React.useEffect(() => {
        let isMounted = true;
        
        DynamicLoader.loadComponent(componentPath, componentName)
          .then(LoadedComponent => {
            if (isMounted) {
              setComponent(() => LoadedComponent);
              setLoading(false);
            }
          })
          .catch(err => {
            if (isMounted) {
              setError(err);
              setLoading(false);
            }
          });
          
        return () => {
          isMounted = false;
        };
      }, []);
      
      if (error) {
        console.error('Dynamic component loading error:', error);
        return fallbackComponent ? React.createElement(fallbackComponent, props) : null;
      }
      
      if (loading || !Component) {
        return React.createElement('div', { className: 'loading-3d-component' }, 'Loading 3D components...');
      }
      
      return React.createElement(Component, props);
    };
  }
  
  /**
   * Preload components for better performance
   */
  static preloadComponents(componentPaths) {
    return Promise.allSettled(
      componentPaths.map(({ path, name = 'default' }) => 
        this.loadComponent(path, name)
      )
    );
  }
  
  /**
   * Clear cache (useful for development or memory management)
   */
  static clearCache() {
    this.componentCache.clear();
    this.loadingPromises.clear();
  }
}

/**
 * Utility function to check if we're in a browser environment
 */
export const isBrowser = () => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Safe dynamic import that only works in browser
 */
export const safeDynamicImport = async (componentPath, componentName = 'default') => {
  if (!isBrowser()) {
    throw new Error('Dynamic imports are only available in browser environment');
  }
  
  return DynamicLoader.loadComponent(componentPath, componentName);
};

export default DynamicLoader;