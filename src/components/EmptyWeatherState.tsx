export default function EmptyWeatherState() {
  return (
    <section
      aria-labelledby="empty-weather-heading"
      className="mt-10 border-t border-white/10 py-10 sm:mt-14 sm:py-14"
    >
      <p className="text-sm font-medium text-sun">SEM CIDADE SELECIONADA</p>
      <h2 className="mt-3 text-xl font-semibold text-white" id="empty-weather-heading">
        Sua previsão começa por uma cidade.
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
        As condições atuais e a previsão de cinco dias serão exibidas aqui após a seleção de um
        local.
      </p>
    </section>
  );
}
