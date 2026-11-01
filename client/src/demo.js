const P=(id,name,description,price,category,stock,featured,image)=>({id,name,description,price,category,stock,featured,image});
export const PRODUCTS=[
  P(6,'Deep Blue Diver','Blue bezel and dial on a steel bracelet, built for the water.',680,'Diver',5,0,'/watches/diver-blue.jpg'),
  P(5,'Rosé Slim','Rose-gold case, cream dial and a tan leather strap.',590,'Classic',4,0,'/watches/rose-cream.jpg'),
  P(4,'Steel Noir','Polished steel case with a black sunburst dial.',540,'Steel',6,0,'/watches/steel-noir.jpg'),
  P(3,'Aurum Classic','Champagne dial, two-tone bracelet.',620,'Classic',3,1,'/watches/two-tone.jpg'),
  P(2,'Noir Chrono','Deep black chronograph.',480,'Black',5,1,'/watches/black-chrono.jpg'),
  P(1,'Fossil Gen 5','Gold-tone automatic with diamond markers.',359,'Gold',8,1,'/watches/gold-classic.jpg')
];
export const SETTINGS={banner:'Complimentary worldwide shipping on all orders',about_title:'Time, Crafted.',
  about_text:'Every S’WATCH timepiece is assembled by hand from sapphire crystal, surgical steel and precious metals.',
  email:'hello@swatch.com',phone:'+1 000 000 0000',address:'1 Watchmaker Lane',social:'https://instagram.com'};
export function demoApi(u,o={}){
  const m=(o.method||'GET').toUpperCase();
  if(m==='GET'&&u==='/products')return PRODUCTS;
  if(m==='GET'&&u==='/settings')return SETTINGS;
  if(m==='GET'&&u.startsWith('/products/')){const p=PRODUCTS.find(x=>String(x.id)===u.split('/')[2]);if(p)return p;throw new Error('Not found')}
  if(m==='POST'&&u==='/orders')throw new Error('This is a demo store, so orders are switched off.');
  throw new Error('Not available in the demo.');
}