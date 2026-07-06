import '../CapaDTO/types.dart';
import '../CapaServicios/api_service.dart';

class EvangelioNegocio {
  final ApiService _api;
  EvangelioNegocio(this._api);

  Future<EvangelioDTO> obtener(String token, String fechaIso) async {
    final r = await _api.get('/evangelio?fecha=$fechaIso', token: token);
    return EvangelioDTO.fromJson(r);
  }
}

