export function renderLoginPage() {
  return `
    <div class="login-screen">
      <div class="login-card">
        <div class="login-brand">
          <div class="sidebar-logo-icon" style="margin:0 auto"><i class="ti ti-school" style="color:white;font-size:20px"></i></div>
          <h1>EDUSMART-CM</h1>
          <p>Éducation Numérique Intelligente au Cameroun</p>
        </div>
        <form id="login-form">
          <div class="form-field" style="margin-bottom:10px">
            <label>Compte démo</label>
            <select id="demo-account">
              <option value="admin|admin123">Administration — admin</option>
              <option value="enseignant|teacher123">Enseignant — enseignant</option>
              <option value="chef|principal123">Chef d'établissement — chef</option>
            </select>
          </div>
          <div class="form-field" style="margin-bottom:10px">
            <label>Identifiant</label>
            <input required name="username" id="username" autocomplete="username" />
          </div>
          <div class="form-field" style="margin-bottom:14px">
            <label>Mot de passe</label>
            <input required type="password" name="password" id="password" autocomplete="current-password" />
          </div>
          <button type="submit" class="btn-primary" style="width:100%;justify-content:center">Se connecter</button>
        </form>
        <p id="login-error" class="login-error"></p>
      </div>
    </div>`;
}
