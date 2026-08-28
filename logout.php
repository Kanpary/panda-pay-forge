<?php
// Inicia a sessão para poder acessá-la
session_start();

// Limpa todas as variáveis da sessão
session_unset();

// Destrói a sessão completamente
session_destroy();

// Redireciona o administrador de volta para a tela de login
header("Location: login.php");
exit;